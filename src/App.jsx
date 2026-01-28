import LoginPage from "@/pages/Login";
import { Navigate, BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { pagesConfig } from "./pages.config";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";

import PromptManagement from "@/pages/PromptManagement";
import PrependManagement from "@/pages/PrependManagement";

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) =>
  Layout ? (
    <Layout currentPageName={currentPageName}>{children}</Layout>
  ) : (
    <>{children}</>
  );

const AuthenticatedApp = () => {
  const { isLoadingAuth, authError } = useAuth();

  // 🔑 SINGURUL loading care blochează UI
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // 🔐 neautentificat → login
  if (authError?.type === "auth_required") {
    return <Navigate to="/login" replace />;
  }

  // ❌ user existent dar neînregistrat
  if (authError?.type === "user_not_registered") {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      {/* INDEX / */}
      <Route
        index
        element={
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        }
      />

      {/* PAGINI NORMALE */}
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={path}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}

      {/* ADMIN */}
      <Route
        path="admin/prompts"
        element={
          <LayoutWrapper currentPageName="admin-prompts">
            <PromptManagement />
          </LayoutWrapper>
        }
      />

      <Route
        path="admin/prepends"
        element={
          <LayoutWrapper currentPageName="admin-prepends">
            <PrependManagement />
          </LayoutWrapper>
        }
      />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          {/* LOGIN – public */}
          <Route path="/login" element={<LoginPage />} />

          {/* APLICAȚIA – protejată */}
          <Route
            path="/*"
            element={
              <AuthProvider>
                <AuthenticatedApp />
              </AuthProvider>
            }
          />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
