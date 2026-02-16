/* eslint-disable react/prop-types */
import { useState } from 'react';

/**
 * COMPONENTE HIJO (Boton)
 * Recibe 'texto' y 'onClick' desde el padre (Props).
 */
function Boton({ onClick, texto }) {
  return (
    <button onClick={onClick}>
      {texto}
    </button>
  );
}

/**
 * COMPONENTE PADRE (App)
 * Gestiona la memoria (Estado).
 */
export default function App() {
  // Estado: el contador empieza en 0
  const [contador, setContador] = useState(0);

  return (
    <div>
      <h1>Contador: {contador}</h1>

      {/* Usamos el componente hijo pasando props */}
      <Boton
        texto="Sumar +1"
        onClick={() => setContador(contador + 1)}
      />

      <br /><br />

      {/* Botón normal para resetear */}
      <button onClick={() => setContador(0)}>
        Poner a cero
      </button>
    </div>
  );
}