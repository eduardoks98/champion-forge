import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="home">
      <h1>Champion Forge</h1>
      <p>MOBA com personagens customizados</p>

      <div className="menu">
        <Link to="/game" className="btn">Jogar</Link>
      </div>
    </div>
  );
}
