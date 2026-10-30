import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { borradorDeRespuesta, construirPrompt, CUESTIONARIO_VACIO, guardarBase, leerBase, leerRespuesta, PROMPT_BASE } from './ia';
import { direccionValida, emparejar, enviar, ErrorJarvis, esperar, guardarConexion, leerConexion, olvidarConexion } from './jarvis';
import { nuevoRecurso } from './recursos';

const memoria = () => {
  const datos = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
  };
};

describe('texto para Claude', () => {
  beforeEach(memoria);

  it('suma el cuestionario al texto base y salta lo vacío', () => {
    const p = construirPrompt(PROMPT_BASE, { ...CUESTIONARIO_VACIO, objetivo: 'Mejorar el rebote', minutos: '12' });
    expect(p.startsWith(PROMPT_BASE)).toBe(true);
    expect(p).toContain('- Goal of the drill: Mejorar el rebote');
    expect(p).toContain('- Time available (minutes): 12');
    expect(p).not.toContain('Age group');
  });

  it('con un recurso añade su título y nota, pero nunca el enlace', () => {
    const r = nuevoRecurso({ titulo: 'Vídeo de rebote', enlace: 'https://ejemplo.com/secreto', nota: 'Bloqueo y salida' });
    const p = construirPrompt(PROMPT_BASE, CUESTIONARIO_VACIO, r);
    expect(p).toContain('Title: Vídeo de rebote');
    expect(p).toContain('Notes: Bloqueo y salida');
    expect(p).not.toContain('ejemplo.com');
  });

  it('el texto base editado se guarda y se puede restaurar', () => {
    expect(leerBase()).toBe(PROMPT_BASE);
    expect(guardarBase('Mi texto base')).toBe(true);
    expect(leerBase()).toBe('Mi texto base');
    guardarBase(PROMPT_BASE);
    expect(leerBase()).toBe(PROMPT_BASE);
    guardarBase('Otro');
    guardarBase('   ');
    expect(leerBase()).toBe(PROMPT_BASE);
  });

  it('el texto base está en inglés y prohíbe inventar jugadas', () => {
    expect(PROMPT_BASE).toContain('Do not invent plays');
    expect(PROMPT_BASE).toContain('Spanish');
  });
});

describe('respuesta de Claude', () => {
  const buena = JSON.stringify({ nombre: 'Rebote en tres', objetivo: 'Bloquear', categoria: 'Rebote', minutos: 12, material: '2 balones', pasos: ['Uno', ' ', 'Dos'], consejos: 'Ojo', variantes: '' });

  it('entiende el JSON aunque venga rodeado de texto', () => {
    const r = leerRespuesta(`Aquí tienes:\n\`\`\`json\n${buena}\n\`\`\``);
    expect(r.nombre).toBe('Rebote en tres');
    expect(r.pasos).toEqual(['Uno', 'Dos']);
    expect(r.categoria).toBe('Rebote');
    expect(r.minutos).toBe(12);
  });

  it('descarta categoría, minutos y tipos que no valen', () => {
    const r = leerRespuesta('{"nombre":"A","categoria":"Magia","minutos":9999,"pasos":"no es lista","consejos":5}');
    expect(r.categoria).toBeUndefined();
    expect(r.minutos).toBeUndefined();
    expect(leerRespuesta('{"minutos":true}').minutos).toBeUndefined();
    expect(r.pasos).toEqual([]);
    expect(r.consejos).toBe('');
  });

  it('si no es JSON, el texto entero va a consejos para no perderlo', () => {
    expect(leerRespuesta('Haz un rondo de cuatro.').consejos).toBe('Haz un rondo de cuatro.');
    expect(leerRespuesta('{roto').consejos).toBe('{roto');
  });

  it('el borrador sale marcado, sin guardar y con lo que escribió el entrenador', () => {
    const f = borradorDeRespuesta(buena, { ...CUESTIONARIO_VACIO, edad: 'Infantil', jugadoras: '10' });
    expect(f.etiquetas).toEqual(['borrador-claude']);
    expect(f.edad).toBe('Infantil');
    expect(f.pasos).toEqual(['Uno', 'Dos']);
    expect(borradorDeRespuesta('{"nombre":"A"}', { ...CUESTIONARIO_VACIO, minutos: '25' }).minutos).toBe(25);
    const vacio = borradorDeRespuesta('{}', CUESTIONARIO_VACIO);
    expect(vacio.nombre).toBe('Ejercicio de Claude');
    expect(vacio.pasos).toEqual(['']);
    const r = nuevoRecurso({ titulo: 'Origen', enlace: 'https://ejemplo.com/a' });
    const conRecurso = borradorDeRespuesta('{}', CUESTIONARIO_VACIO, r);
    expect(conRecurso.nombre).toBe('Origen');
    expect(conRecurso.recursoId).toBe(r.id);
    expect(conRecurso.fuente).toBe('https://ejemplo.com/a');
  });
});

describe('conexión con Jarvis', () => {
  beforeEach(memoria);
  afterEach(() => vi.unstubAllGlobals());

  it('solo acepta Tailscale por https o este PC', () => {
    expect(direccionValida('katana.tail1234.ts.net')).toBe('https://katana.tail1234.ts.net');
    expect(direccionValida('https://katana.tail1234.ts.net/loquesea?x=1')).toBe('https://katana.tail1234.ts.net');
    expect(direccionValida('http://127.0.0.1:8770/')).toBe('http://127.0.0.1:8770');
    expect(direccionValida('http://katana.tail1234.ts.net')).toBeUndefined();
    expect(direccionValida('https://malo.example.com')).toBeUndefined();
    expect(direccionValida('https://a.ts.net.malo.com')).toBeUndefined();
    expect(direccionValida('https://usuario:clave@a.ts.net')).toBeUndefined();
    expect(direccionValida('javascript:alert(1)')).toBeUndefined();
    expect(direccionValida('')).toBeUndefined();
  });

  it('guarda y olvida la conexión, y ignora datos rotos', () => {
    expect(leerConexion()).toBeUndefined();
    guardarConexion({ url: 'https://a.ts.net', token: 'x' });
    expect(leerConexion()).toEqual({ url: 'https://a.ts.net', token: 'x' });
    localStorage.setItem('horns.jarvis', JSON.stringify({ url: 'https://malo.com', token: 'x' }));
    expect(leerConexion()).toBeUndefined();
    guardarConexion({ url: 'https://a.ts.net', token: 'x' });
    olvidarConexion();
    expect(leerConexion()).toBeUndefined();
  });

  it('empareja con el código, guarda la clave y manda la clave en cada petición', async () => {
    const llamadas: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      llamadas.push({ url, init });
      const ok = (d: unknown) => ({ ok: true, status: 200, json: async () => d });
      if (url.endsWith('/pair')) return ok({ token: 'CLAVE' });
      if (url.endsWith('/ask')) return ok({ id: 'abc' });
      return ok({ status: 'lista', a: 'Hecho' });
    });
    const c = await emparejar(' katana.tail1.ts.net ', '123 456');
    expect(c).toEqual({ url: 'https://katana.tail1.ts.net', token: 'CLAVE' });
    expect(leerConexion()).toEqual(c);
    expect(JSON.parse(String(llamadas[0].init.body))).toEqual({ code: '123456' });
    expect(await enviar(c, 'Hola')).toBe('abc');
    expect((llamadas[1].init.headers as Record<string, string>).Authorization).toBe('Bearer CLAVE');
    expect(await esperar(c, 'abc', () => false, 1)).toBe('Hecho');
    expect(llamadas[2].url).toBe('https://katana.tail1.ts.net/api/horns/result?id=abc');
  });

  it('rechaza código o dirección mal escritos sin llamar a nadie', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    await expect(emparejar('https://malo.com', '123456')).rejects.toThrow('dirección');
    await expect(emparejar('a.ts.net', '12')).rejects.toThrow('6 cifras');
    expect(f).not.toHaveBeenCalled();
  });

  it('pide reconectar si Jarvis ya no reconoce la clave', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 401, json: async () => ({ error: 'clave' }) }));
    const e = await enviar({ url: 'https://a.ts.net', token: 'x' }, 'Hola').catch((x) => x);
    expect(e).toBeInstanceOf(ErrorJarvis);
    expect(e.reemparejar).toBe(true);
  });

  it('enseña el motivo que da Jarvis, y avisa si no llega', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 400, json: async () => ({ error: 'Hoy ya van 25 envíos; mañana más.' }) }));
    await expect(enviar({ url: 'https://a.ts.net', token: 'x' }, 'Hola')).rejects.toThrow('25 envíos');
    vi.stubGlobal('fetch', async () => { throw new TypeError('network'); });
    await expect(enviar({ url: 'https://a.ts.net', token: 'x' }, 'Hola')).rejects.toThrow('No llego a Jarvis');
  });

  it('espera con paciencia: sigue si Jarvis dice «pensando» y corta con un error de Claude', async () => {
    let n = 0;
    vi.stubGlobal('fetch', async () => ({ ok: true, status: 200, json: async () => (++n < 3 ? { status: 'pensando' } : { status: 'lista', a: 'Listo' }) }));
    expect(await esperar({ url: 'https://a.ts.net', token: 'x' }, 'i', () => false, 1)).toBe('Listo');
    vi.stubGlobal('fetch', async () => ({ ok: true, status: 200, json: async () => ({ status: 'error', error: 'Claude no responde.' }) }));
    await expect(esperar({ url: 'https://a.ts.net', token: 'x' }, 'i', () => false, 1)).rejects.toThrow('no responde');
  });

  it('se puede cancelar la espera y un corte suelto no la tira', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: true, status: 200, json: async () => ({ status: 'pensando' }) }));
    await expect(esperar({ url: 'https://a.ts.net', token: 'x' }, 'i', () => true, 1)).rejects.toThrow('Cancelado');
    let n = 0;
    vi.stubGlobal('fetch', async () => {
      if (++n === 1) throw new TypeError('network');
      return { ok: true, status: 200, json: async () => ({ status: 'lista', a: 'Ya' }) };
    });
    expect(await esperar({ url: 'https://a.ts.net', token: 'x' }, 'i', () => false, 1)).toBe('Ya');
  });
});
