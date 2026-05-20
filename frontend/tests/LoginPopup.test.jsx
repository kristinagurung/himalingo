import {describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LoginPopup from "../components/LoginPopup";

// ── LoginPopup component tests ───────────────────────────────────────────
describe("LoginPopup components", () => {
    it("renders email and password inputs", () => {
        const mockOnClose = vi.fn();
        render(<LoginPopup onClose={mockOnClose} />);
        
        // Verify Email input exists
        expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
        
        // Verify Password input exists
        expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();

        // Verify Login button exists
        expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    }); 

    
});