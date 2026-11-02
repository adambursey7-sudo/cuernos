import { describe, expect, it } from 'vitest';
import { anonimizar, borradoresLocales, leerRespuesta, leerTabla, promptBandeja, repartir, type Borrador } from './bandeja';
import { nuevoEvento } from '../temporada/temporada';

const plantilla = [
  { id: 'a', nombre: 'Jugador Uno', numero: '7' },
  { id: 'b', nombre: 'Jugador Dos', numero: '10' },
  { id: 'c', nombre: 'Jugador Tres', numero: '07' },
];

describe('tabla de estadística', () => {
  it('lee un CSV con cabecera y varias columnas', () => {
    const f = leerTabla('Dorsal;Pts;Faltas;Reb;Ast\n7;12;2;4;1\n10;8;5;0;3\nTotal;20;7;4;4');
    expect(f).toEqual([
      { dorsal: '7', p: 12, f: 2, reb: 4, ast: 1 },
      { dorsal: '10', p: 8, f: 5, ast: 3 },
    ]);
  });
  it('acepta tabuladores, barras y cabeceras con tildes', () => {
    expect(leerTabla('Nº\tPuntos\tPérdidas\n4\t6\t2')).toEqual([{ dorsal: '4', p: 6, f: 0, per: 2 }]);
    expect(leerTabla('# | PTS\n9 | 3')).toEqual([{ dorsal: '9', p: 3, f: 0 }]);
  });
  it('un texto que no es tabla no da filas', () => {
    expect(leerTabla('Muy buen partido, la defensa funcionó.')).toEqual([]);
  });
  it('limita los números absurdos', () => {
    expect(leerTabla('Dorsal,Pts,F\n5,9999,40')[0]).toMatchObject({ p: 300, f: 7 });
  });
});

describe('privacidad', () => {
  it('cambia nombres completos y sus trozos por el dorsal', () => {
    const r = anonimizar('Jugador Uno metió 12. Dos faltas de Jugador Dos; uno de ellos jugó bien. Tres fue clave.', plantilla);
    expect(r.texto).toContain('#7 metió 12');
    expect(r.texto).toContain('#10;');
    expect(r.texto).not.toMatch(/Jugador (Uno|Dos)/);
    expect(r.cambios).toBeGreaterThan(1);
  });
  it('no toca palabras que solo contienen el nombre', () => {
    const r = anonimizar('Uno-contra-uno y desuno', [{ nombre: 'Uno', numero: '3' }]);
    expect(r.texto).toBe('#3-contra-#3 y desuno');
  });
  it('el texto que se manda a Claude no lleva nombres', () => {
    const { texto } = anonimizar('Jugador Uno falló dos tiros libres', plantilla);
    expect(promptBandeja(texto)).not.toContain('Jugador Uno');
  });
});

describe('sin conexión', () => {
  it('con tabla saca estadística; sin tabla, una nota; vacío, nada', () => {
    expect(borradoresLocales('Dorsal;Pts\n7;12')[0].tipo).toBe('boxscore');
    expect(borradoresLocales('Mucho mejor la defensa')[0].tipo).toBe('notas');
    expect(borradoresLocales('   ')).toEqual([]);
  });
});

describe('respuesta de Claude', () => {
  const buena = '```json\n{"borradores":[{"tipo":"boxscore","titulo":"","filas":[{"dorsal":"#7","p":"12","f":2,"reb":3},{"dorsal":"Ana","p":4}]},{"tipo":"notas","texto":"Cerrar el rebote"},{"tipo":"rival","rasgos":["zona","inventado"],"vigilar":"#9 tira de tres","haremos":"Pasar rápido"},{"tipo":"ejercicio","titulo":"Rebote 3x3","objetivo":"Cerrar","pasos":["Uno","Dos"]},{"tipo":"otro"}]}\n```';
  it('valida cada borrador y tira lo que no cuadra', () => {
    const l = leerRespuesta(buena);
    expect(l.map((b) => b.tipo)).toEqual(['boxscore', 'notas', 'rival', 'ejercicio']);
    expect((l[0] as { filas: unknown[] }).filas).toEqual([{ dorsal: '7', p: 12, f: 2, reb: 3 }]);
    expect((l[2] as { rasgos: string[] }).rasgos).toEqual(['zona']);
    expect(l.every((b) => b.incluir)).toBe(true);
  });
  it('no lanza con basura', () => {
    for (const t of ['', 'hola', '{', '{"borradores":3}', '{"borradores":[null,5,"x"]}']) expect(leerRespuesta(t)).toEqual([]);
  });
});

describe('repartir solo al aceptar', () => {
  const partido = { ...nuevoEvento('2026-11-01', 'partido'), balance: 'Ganamos.' };
  const lista: Borrador[] = [
    { id: '1', tipo: 'boxscore', titulo: '', filas: [{ dorsal: '7', p: 12, f: 2 }, { dorsal: '10', p: 8, f: 1, reb: 4 }, { dorsal: '99', p: 2, f: 0 }], incluir: true },
    { id: '2', tipo: 'notas', titulo: '', texto: 'Cerrar el rebote', incluir: true },
    { id: '3', tipo: 'rival', titulo: '', rasgos: ['zona'], vigilar: '#9', haremos: 'Pasar rápido', incluir: true },
    { id: '4', tipo: 'ejercicio', titulo: 'Rebote 3x3', objetivo: 'Cerrar', pasos: ['Uno'], incluir: false },
  ];
  it('reparte estadística, nota e informe; avisa del dorsal desconocido y respeta los excluidos', () => {
    const r = repartir(lista, partido, [plantilla[0], plantilla[1]]);
    expect(r.evento.directo).toEqual({ a: { p: 12, f: 2 }, b: { p: 8, f: 1, reb: 4 } });
    expect(r.evento.balance).toBe('Ganamos.\nCerrar el rebote');
    expect(r.evento.rival).toEqual({ rasgos: ['zona'], vigilar: '#9', haremos: 'Pasar rápido' });
    expect(r.fichas).toEqual([]);
    expect(r.avisos).toHaveLength(1);
    expect(r.repartidos).toBe(3);
  });
  it('un dorsal repetido no se adivina y «07» sirve para «7» solo si no hay duda', () => {
    const dudoso = repartir([lista[0]], partido, [plantilla[0], { id: 'z', numero: '7' }]);
    expect(dudoso.avisos.join()).toContain('Dorsal 7');
    const solo = repartir([{ ...lista[0], filas: [{ dorsal: '7', p: 5, f: 0 }] } as Borrador], partido, [plantilla[2]]);
    expect(solo.evento.directo).toEqual({ c: { p: 5, f: 0 } });
  });
  it('el ejercicio incluido se convierte en ficha; no cambia el partido original', () => {
    const r = repartir([{ ...lista[3], incluir: true }], partido, []);
    expect(r.fichas[0]).toMatchObject({ nombre: 'Rebote 3x3', pasos: ['Uno'], etiquetas: ['bandeja'] });
    expect(partido.directo).toBeUndefined();
  });
  it('analizar y repartir no escriben en el almacenamiento', () => {
    const escrituras: string[] = [];
    (globalThis as { localStorage?: unknown }).localStorage = { getItem: () => null, setItem: (k: string) => void escrituras.push(k), removeItem: () => {} };
    repartir(borradoresLocales('Dorsal;Pts\n7;12'), partido, plantilla);
    leerRespuesta('{"borradores":[]}');
    expect(escrituras).toEqual([]);
  });
});
