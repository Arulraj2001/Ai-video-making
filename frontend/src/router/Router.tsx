import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface RouterContextType {
  path: string;
  navigate: (to: string) => void;
  replace: (to: string) => void;
  searchParams: URLSearchParams;
}

const RouterContext = createContext<RouterContextType>({
  path: "/",
  navigate: () => {},
  replace: () => {},
  searchParams: new URLSearchParams(),
});

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [path, setPath] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname || "/";
    }
    return "/";
  });

  const [searchParams, setSearchParams] = useState<URLSearchParams>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname || "/");
      setSearchParams(new URLSearchParams(window.location.search));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((to: string) => {
    if (typeof window === "undefined") return;
    const url = new URL(to, window.location.origin);
    window.history.pushState({}, "", url.toString());
    setPath(url.pathname);
    setSearchParams(new URLSearchParams(url.search));
    window.scrollTo(0, 0);
  }, []);

  const replace = useCallback((to: string) => {
    if (typeof window === "undefined") return;
    const url = new URL(to, window.location.origin);
    window.history.replaceState({}, "", url.toString());
    setPath(url.pathname);
    setSearchParams(new URLSearchParams(url.search));
  }, []);

  return (
    <RouterContext.Provider value={{ path, navigate, replace, searchParams }}>
      {children}
    </RouterContext.Provider>
  );
};

export function useRouter() {
  return useContext(RouterContext);
}

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  replace?: boolean;
  children: React.ReactNode;
}

export const Link: React.FC<LinkProps> = ({ to, replace = false, children, onClick, ...props }) => {
  const { navigate, replace: replacePath } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      if (replace) {
        replacePath(to);
      } else {
        navigate(to);
      }
    }
  };

  return (
    <a href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  );
};

/**
 * Extract URL parameters from a pattern like "/app/studio/:projectId"
 */
export function matchRoute(pattern: string, currentPath: string): { matches: boolean; params: Record<string, string> } {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = currentPath.split("/").filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return { matches: false, params: {} };
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const pPart = patternParts[i];
    const cPart = pathParts[i];

    if (pPart.startsWith(":")) {
      params[pPart.slice(1)] = decodeURIComponent(cPart);
    } else if (pPart !== cPart) {
      return { matches: false, params: {} };
    }
  }

  return { matches: true, params };
}
