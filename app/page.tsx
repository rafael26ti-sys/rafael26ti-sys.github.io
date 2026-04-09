export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Controle Rural SaaS</h1>
          <p className="mt-2 text-gray-600">
            Sistema moderno de controle de produção rural para produtores e agricultores
          </p>
        </div>
      </header>

      <nav className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4 flex gap-6">
          <a href="/login" className="text-green-600 hover:text-green-700 font-medium">
            Entrar
          </a>
          <a href="/register" className="text-green-600 hover:text-green-700 font-medium">
            Criar Conta
          </a>
          <a href="/dashboard" className="text-green-600 hover:text-green-700 font-medium">
            Dashboard
          </a>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <section className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Bem-vindo ao Controle Rural</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Organize sua produção, gastos e vendas de forma fácil pelo celular ou computador.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Plantações</h3>
                <p className="text-sm text-gray-600">
                  Registro de plantios e previsão de colheita
                </p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Gastos</h3>
                <p className="text-sm text-gray-600">
                  Controle de despesas com insumos e produção
                </p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Produção</h3>
                <p className="text-sm text-gray-600">
                  Quantidade produzida por safra ou período
                </p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Animais</h3>
                <p className="text-sm text-gray-600">
                  Cadastro e acompanhamento do rebanho
                </p>
              </div>
            </div>
          </section>

          <section className="text-center">
            <a
              href="/register"
              className="inline-block bg-green-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-green-700 transition"
            >
              Comece Agora
            </a>
          </section>
        </div>
      </main>

      <footer className="bg-gray-900 text-white mt-12 py-6">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2026 - Controle Rural SaaS. Desenvolvido com ❤️</p>
        </div>
      </footer>
    </div>
  );
}
