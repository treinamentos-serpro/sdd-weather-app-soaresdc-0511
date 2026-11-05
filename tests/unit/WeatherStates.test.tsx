import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EmptyState from "../../src/components/states/EmptyState";
import ErrorState from "../../src/components/states/ErrorState";
import LoadingState from "../../src/components/states/LoadingState";

describe("LoadingState", () => {
  it("anuncia o carregamento como status", () => {
    render(<LoadingState />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando dados do tempo...");
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });
});

describe("ErrorState", () => {
  it("exibe a mensagem e aciona retry quando solicitado", () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Falha na consulta." onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Falha na consulta.");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("EmptyState", () => {
  it("exibe o título e a dica em um status acessível", () => {
    render(<EmptyState title="Cidade não encontrada" hint="Confira a grafia e tente novamente." />);

    expect(screen.getByRole("status")).toHaveTextContent("Cidade não encontrada");
    expect(screen.getByText("Confira a grafia e tente novamente.")).toBeInTheDocument();
  });
});