import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import {
  RegistrationSuccess,
  saveRegistrationConfirmation,
} from "./registration-success";
afterEach(() => {
  cleanup();
  sessionStorage.clear();
});
it("does not claim success without a completed legacy registration", () => {
  render(<RegistrationSuccess />);
  expect(
    screen.getByRole("link", { name: "Go to registration" }),
  ).toHaveAttribute("href", "/register");
});
it("preserves legacy email-activation confirmation", () => {
  saveRegistrationConfirmation({
    email: "ada@example.com",
    message: "Please verify your email.",
  });
  render(<RegistrationSuccess />);
  expect(
    screen.getByRole("heading", { name: "Check your email" }),
  ).toBeInTheDocument();
  expect(screen.getByText("ada@example.com")).toBeInTheDocument();
});
