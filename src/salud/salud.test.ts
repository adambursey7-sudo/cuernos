import { beforeEach, describe, expect, it } from 'vitest';
import { armarCopia, leerCopia } from '../copia';
import { guardarDiario, leerDiario, nuevaJugadora, nuevoEquipo } from '../diario/diario';
import { PALETAS } from '../temas';
import {
  abrirDetalle, avisosDeCarga, bloquear, CLAVE_SALUD, desbloquear, desbloqueado, detalleVacio, diasDeBaja, guardarParte, hayPin,
  lesionesActivas, parteActivo, partesDe, ponerPin, quitarPin, sincronizarEstados,
} from './salud';

let datos: Map<string, string>;
beforeEach(() => {
  datos = new Map();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
    length: 0,
    key: () => null,
  };
  bloquear();
});

const equipo = nuevoEquipo('Equipo de prueba');
const conLesion = (numero = '7') => nuevaJugadora(equipo.id, { nombre: 'Jugador Uno', numero, lesion: { desde: '2026-10-30', nota: 'Tobillo' } });

describe('aislamiento: la salud no sale del almacén de salud', () => {
  it('guardar el diario manda la lesión al almacén de salud y la quita del diario', () => {
    const j = conLesion();
    expect(guardarDiario({ equipos: [equipo], jugadoras: [j, nuevaJugadora(equipo.id, { numero: '8' })] })).toBe(true);
    const guardado = datos.get('horns.diario')!;
    expect(guardado).not.toContain('Tobillo');
    expect(guardado).not.toContain('lesion');
    expect(datos.get(CLAVE_SALUD)).toContain('Tobillo');
    // para la pantalla la jugadora sigue lesionada (solo estado y fecha)
    const leida = leerDiario().jugadoras.find((x) => x.id === j.id)!;
    expect(leida.lesion).toEqual({ desde: '2026-10-30', nota: '' });
  });
  it('un diario antiguo con lesiones se limpia solo y no pierde el estado', () => {
    const j = conLesion();
    datos.set('horns.diario', JSON.stringify({ equipos: [equipo], jugadoras: [j] }));
    expect(leerDiario().jugadoras[0].lesion?.desde).toBe('2026-10-30');
    expect(datos.get('horns.diario')).not.toContain('Tobillo');
    expect(partesDe(j.id)).toHaveLength(1);
  });
  it('la copia de seguridad no lleva salud, la pidan o no, y una copia vieja con lesiones no las importa', () => {
    const j = conLesion();
    guardarDiario({ equipos: [equipo], jugadoras: [j] });
    for (const quiere of [false, true]) {
      const texto = armarCopia([], PALETAS[0], { equipos: [equipo], jugadoras: [j] }, undefined, undefined, undefined, quiere);
      expect(texto).not.toContain('Tobillo');
      expect(texto).not.toContain('lesion');
      expect(texto).not.toContain(CLAVE_SALUD);
    }
    const app = JSON.parse(armarCopia([], PALETAS[0])).app;
    const vieja = JSON.stringify({ app, mios: [], diario: { equipos: [equipo], jugadoras: [j] } });
    expect(leerCopia(vieja).diario?.jugadoras[0].lesion).toBeUndefined();
  });
  it('solo el módulo de salud conoce la clave del almacén', () => {
    const fuentes = import.meta.glob('../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    const fuera = Object.entries(fuentes).filter(([ruta, texto]) => !/\.test\./.test(ruta) && !/(^|\/)salud\.ts$/.test(ruta) && texto.includes('horns.salud')).map(([ruta]) => ruta);
    expect(Object.keys(fuentes).length).toBeGreaterThan(50);
    expect(fuera).toEqual([]);
  });
});

describe('partes y estados', () => {
  it('duda y baja; al quitar la lesión queda el alta con fecha y el historial', () => {
    const j = conLesion();
    sincronizarEstados([j]);
    expect(parteActivo(j.id)).toMatchObject({ estado: 'baja', desde: '2026-10-30' });
    sincronizarEstados([{ id: j.id, lesion: { desde: '2026-10-30', nota: '', duda: true } }]);
    expect(parteActivo(j.id)?.estado).toBe('duda');
    sincronizarEstados([{ id: j.id }], { hoy: '2026-11-05' });
    expect(parteActivo(j.id)).toBeUndefined();
    expect(partesDe(j.id)[0]).toMatchObject({ activo: false, alta: '2026-11-05' });
    expect(lesionesActivas().size).toBe(0);
  });
  it('limpia los partes de quien ya no está en la plantilla, pero no en una migración parcial', () => {
    sincronizarEstados([conLesion('1'), { id: 'otra', lesion: { desde: '2026-10-01' } }]);
    sincronizarEstados([{ id: 'otra' }], { completo: false });
    expect(JSON.parse(datos.get(CLAVE_SALUD)!).partes).toHaveLength(2);
    sincronizarEstados([{ id: 'otra' }]);
    expect(JSON.parse(datos.get(CLAVE_SALUD)!).partes).toHaveLength(1);
  });
  it('cuenta los días de baja', () => {
    expect(diasDeBaja({ desde: '2026-10-30' }, '2026-11-02')).toBe(3);
    expect(diasDeBaja({ desde: '2026-10-30', alta: '2026-11-01' }, '2026-12-01')).toBe(2);
  });
  it('avisa de la carga: minutos máximos o sin contacto', async () => {
    const j = conLesion();
    sincronizarEstados([j]);
    expect(await guardarParte(parteActivo(j.id)!.id, { sinContacto: true, maxMinutos: 30 })).toBe(true);
    expect(avisosDeCarga(60)).toEqual([{ jugadoraId: j.id, texto: 'Máximo 30 min (la sesión dura 60)' }]);
    expect(avisosDeCarga(20)).toEqual([{ jugadoraId: j.id, texto: 'Sin contacto' }]);
  });
});

describe('PIN y cifrado', () => {
  it('con PIN los detalles no se leen en el almacén ni sin desbloquear', async () => {
    const j = conLesion();
    sincronizarEstados([j]);
    const id = parteActivo(j.id)!.id;
    expect(await guardarParte(id, {}, { ...detalleVacio(), tipo: 'Esguince', grado: 'leve', nota: 'Sin saltar' })).toBe(true);
    expect(datos.get(CLAVE_SALUD)).toContain('Esguince');
    expect(await ponerPin('1234')).toBe(true);
    expect(hayPin()).toBe(true);
    const crudo = datos.get(CLAVE_SALUD)!;
    expect(crudo).not.toContain('Esguince');
    expect(crudo).not.toContain('Sin saltar');
    bloquear();
    expect(desbloqueado()).toBe(false);
    expect(await abrirDetalle(id)).toBe('bloqueado');
    expect(await guardarParte(id, {}, detalleVacio())).toBe(false);
    expect(await desbloquear('0000')).toBe(false);
    expect(await desbloquear('1234')).toBe(true);
    expect(await abrirDetalle(id)).toMatchObject({ tipo: 'Esguince', grado: 'leve', nota: 'Sin saltar' });
    // el resumen sigue disponible sin PIN
    bloquear();
    expect(parteActivo(j.id)?.estado).toBe('baja');
  });
  it('un parte nuevo con PIN puesto no guarda notas sueltas sin cifrar', async () => {
    const a = conLesion('1');
    sincronizarEstados([a]);
    expect(await ponerPin('4321')).toBe(true);
    const b = conLesion('2');
    sincronizarEstados([a, b]);
    expect(datos.get(CLAVE_SALUD)).not.toContain('Tobillo');
  });
  it('quitar el PIN devuelve los detalles legibles; el PIN debe tener 4 a 8 cifras', async () => {
    const j = conLesion();
    sincronizarEstados([j]);
    const id = parteActivo(j.id)!.id;
    await guardarParte(id, {}, { ...detalleVacio(), tipo: 'Muñeca' });
    expect(await ponerPin('12')).toBe(false);
    expect(await ponerPin('123456')).toBe(true);
    expect(await quitarPin()).toBe(true);
    expect(hayPin()).toBe(false);
    expect(await abrirDetalle(id)).toMatchObject({ tipo: 'Muñeca' });
  });
});
