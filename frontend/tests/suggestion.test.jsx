// frontend/tests/Suggestions.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Suggestions from "../components/Suggestions";

// ── Suggestions component tests ───────────────────────────────────────────
describe("Suggestions component", () => {
  it("renders example chips", () => {
    const mockOnSelect = vi.fn();
    const mockSetMode  = vi.fn();

    render(
      <Suggestions
        onSelect={mockOnSelect}
        setMode={mockSetMode}
        isChatting={false}
      />
    );

    // Check chips are visible
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("How are you?")).toBeInTheDocument();
    expect(screen.getByText("Thank you")).toBeInTheDocument();
    expect(screen.getByText("Good morning")).toBeInTheDocument();
  });

  it("calls onSelect when chip is clicked", () => {
    const mockOnSelect = vi.fn();
    const mockSetMode  = vi.fn();

    render(
      <Suggestions
        onSelect={mockOnSelect}
        setMode={mockSetMode}
        isChatting={false}
      />
    );

    fireEvent.click(screen.getByText("Hello"));

    // Should have been called with translate prompt
   // This replaces lines 43, 44, and 45
expect(mockOnSelect).toHaveBeenCalledWith(
  expect.stringContaining("Hello"),
  null,
  ""
);
  });

  it("calls setMode with translate when chip clicked", () => {
    const mockOnSelect = vi.fn();
    const mockSetMode  = vi.fn();

    render(
      <Suggestions
        onSelect={mockOnSelect}
        setMode={mockSetMode}
        isChatting={false}
      />
    );

    fireEvent.click(screen.getByText("Thank you"));
    expect(mockSetMode).toHaveBeenCalledWith("translate");
  });

  it("renders nothing when isChatting is true", () => {
    const mockOnSelect = vi.fn();
    const mockSetMode  = vi.fn();

    const { container } = render(
      <Suggestions
        onSelect={mockOnSelect}
        setMode={mockSetMode}
        isChatting={true}
      />
    );

    // Component returns null when chatting
    expect(container.firstChild).toBeNull();
  });

  it("shows Try these examples label", () => {
    render(
      <Suggestions
        onSelect={vi.fn()}
        setMode={vi.fn()}
        isChatting={false}
      />
    );
    expect(screen.getByText("Try these examples")).toBeInTheDocument();
  });
});
