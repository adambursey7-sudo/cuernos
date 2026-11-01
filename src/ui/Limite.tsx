// Si una pantalla que se carga al abrirla no llega (sin conexión, app recién actualizada), se avisa y se puede reintentar en vez de quedarse en blanco.
import { Component, type ReactNode } from 'react';

export class Limite extends Component<{ children: ReactNode }, { fallo: boolean }> {
  state = { fallo: false };
  static getDerivedStateFromError() { return { fallo: true }; }
  render() {
    if (!this.state.fallo) return this.props.children;
    return (
      <div className="vacio-pro" role="alert">
        <b>No se ha podido abrir esta pantalla</b>
        <p>Puede que no haya conexión o que la app se acabe de actualizar. Tus datos están a salvo.</p>
        <button className="principal" onClick={() => location.reload()}>Volver a cargar</button>
      </div>
    );
  }
}
