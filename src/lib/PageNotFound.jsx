import { useLocation, Link } from 'react-router-dom';

export default function PageNotFound() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-7xl font-light text-muted-foreground/40">404</h1>
        <p className="text-muted-foreground">A página "{location.pathname.substring(1)}" não existe.</p>
        <Link to="/" className="inline-flex px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">Voltar ao painel</Link>
      </div>
    </div>
  );
}