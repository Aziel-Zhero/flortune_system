
// src/app/page.tsx
// O middleware agora cuida dos redirecionamentos com base na autenticação.
// Esta página pode ser um simples placeholder ou não ser renderizada se o middleware sempre redirecionar.
export default function RootPage() {
  // O middleware deve redirecionar para /login ou /dashboard.
  // Este return é para satisfazer o TypeScript, pois o redirect no middleware interrompe.
  return null;
}
