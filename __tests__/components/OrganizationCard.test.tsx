import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import OrganizationCard from "@/components/profile/OrganizationCard";

describe("OrganizationCard", () => {
  it("renders name, industry, and description", () => {
    render(
      <OrganizationCard
        name="Acme Manufacturing"
        industry="Manufacturing"
        description="A mid-size auto parts manufacturer."
        location="Bursa, Turkey"
      />
    );

    expect(screen.getByText("Acme Manufacturing")).toBeInTheDocument();
    expect(screen.getByText("Manufacturing")).toBeInTheDocument();
    expect(
      screen.getByText("A mid-size auto parts manufacturer.")
    ).toBeInTheDocument();
  });
});
