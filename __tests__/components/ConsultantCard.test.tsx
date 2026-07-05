import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ConsultantCard from "@/components/profile/ConsultantCard";

describe("ConsultantCard", () => {
  it("renders name, title, and expertise tags", () => {
    render(
      <ConsultantCard
        name="Jane Doe"
        title="Lean Transformation Coach"
        bio="15 years of experience."
        expertise={["Lean", "Six Sigma"]}
        location="Istanbul, Turkey"
      />
    );

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Lean Transformation Coach")).toBeInTheDocument();
    expect(screen.getByText("Lean")).toBeInTheDocument();
    expect(screen.getByText("Six Sigma")).toBeInTheDocument();
  });
});
