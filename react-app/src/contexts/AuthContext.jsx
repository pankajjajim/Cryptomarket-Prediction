import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetch("/api/verify", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          logout();
          return null;
        }

        return res.json();
      })
      .then((data) => {
        if (!data) return;

        if (data.user) {
          setUser(data.user);
        } else {
          logout();
        }
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const login = async (email, password) => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser({ email });

      return {
        success: true,
      };
    }

    return {
      success: false,
      error: data.error,
    };
  };

  const register = async (username, email, password) => {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
      };
    }

    return {
      success: false,
      error: data.error,
    };
  };

  const buyCrypto = async (cryptoType, amount, price) => {
    const response = await fetch("/api/buy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        cryptoType,
        amount,
        price,
      }),
    });

    if (response.status === 401) {
      logout();

      return {
        success: false,
        error: "Session Expired",
      };
    }

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
      };
    }

    return {
      success: false,
      error: data.error,
    };
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    buyCrypto,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};