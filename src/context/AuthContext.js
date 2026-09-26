"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext();

const DEFAULT_STAFF = [
  { id: "staff-1", name: "Rahul (Cashier)", code: "EMP-101", pin: "1111" },
  { id: "staff-2", name: "Priya (Counter)", code: "EMP-102", pin: "2222" },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Role Management State
  const [role, setRole] = useState(null); // null | "manager" | "employee"
  const [activeStaff, setActiveStaff] = useState(null);
  const [managerPin, setManagerPin] = useState("1234");
  const [staffList, setStaffList] = useState(DEFAULT_STAFF);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load saved PINs & Staff
      const savedPin = localStorage.getItem("stall_manager_pin");
      if (savedPin) setManagerPin(savedPin);

      const savedStaff = localStorage.getItem("stall_staff_list");
      if (savedStaff) {
        try { setStaffList(JSON.parse(savedStaff)); } catch (e) {}
      }

      const savedRole = localStorage.getItem("stall_active_role");
      const savedActiveStaff = localStorage.getItem("stall_active_staff");

      if (savedRole) setRole(savedRole);
      if (savedActiveStaff) {
        try { setActiveStaff(JSON.parse(savedActiveStaff)); } catch (e) {}
      }
    }
    setLoading(false);
  }, []);

  // Sync staff & manager pin to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("stall_manager_pin", managerPin);
    }
  }, [managerPin]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("stall_staff_list", JSON.stringify(staffList));
    }
  }, [staffList]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (role) {
        localStorage.setItem("stall_active_role", role);
      } else {
        localStorage.removeItem("stall_active_role");
      }
      if (activeStaff) {
        localStorage.setItem("stall_active_staff", JSON.stringify(activeStaff));
      } else {
        localStorage.removeItem("stall_active_staff");
      }
    }
  }, [role, activeStaff]);

  /* ======== AUTH & ROLE METHODS ======== */
  const loginAsManager = (pin) => {
    if (pin === managerPin) {
      setRole("manager");
      setActiveStaff(null);
      return { success: true };
    }
    return { success: false, error: "Incorrect Manager PIN! (Default is 1234)" };
  };

  const loginAsEmployee = (codeOrPin) => {
    const staff = staffList.find(s => s.pin === codeOrPin || s.code.toLowerCase() === codeOrPin.toLowerCase());
    if (staff) {
      setRole("employee");
      setActiveStaff(staff);
      return { success: true, staff };
    }
    return { success: false, error: "Invalid Employee PIN or Code! Contact your Manager." };
  };

  const updateManagerPin = (newPin) => {
    if (!newPin || newPin.length < 4) return { success: false, error: "PIN must be at least 4 digits" };
    setManagerPin(newPin);
    return { success: true };
  };

  const addStaff = ({ name, code, pin }) => {
    const newStaff = {
      id: `staff-${Date.now()}`,
      name,
      code: code || `EMP-${Math.floor(100 + Math.random() * 900)}`,
      pin: pin || `${Math.floor(1000 + Math.random() * 9000)}`,
    };
    setStaffList((prev) => [...prev, newStaff]);
    return newStaff;
  };

  const deleteStaff = (id) => {
    setStaffList((prev) => prev.filter(s => s.id !== id));
  };

  const signOut = () => {
    try { supabase.auth.signOut(); } catch (e) {}
    setRole(null);
    setActiveStaff(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("stall_active_role");
      localStorage.removeItem("stall_active_staff");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role,
        activeStaff,
        managerPin,
        staffList,
        loginAsManager,
        loginAsEmployee,
        updateManagerPin,
        addStaff,
        deleteStaff,
        setRole,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
