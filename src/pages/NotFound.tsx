import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import SEOHead from '@/components/SEOHead';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
      <SEOHead
        title="Página Não Encontrada - VaiMogi"
        description="A página que você está procurando não foi encontrada. Retorne à página inicial da VaiMogi para acessar nossa plataforma de transporte escolar."
        keywords="404, página não encontrada, erro, VaiMogi, transporte escolar"
        url="https://vaimogi.com/404"
        type="website"
      />
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
          <a href="/" className="text-blue-500 hover:text-blue-700 underline">
            Return to Home
          </a>
        </div>
      </div>
    </>
  );
};

export default NotFound;
