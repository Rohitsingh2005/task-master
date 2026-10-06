import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import TicketForm from "./TicketForm";
import { createTicket } from "../../../services/ticketStorage";

const renderForm = (props = {}) => {
  const onSubmit = vi.fn();
  const onClose = vi.fn();

  render(
    <TicketForm
      onSubmit={onSubmit}
      onClose={onClose}
      titleId="form-title"
      {...props}
    />,
  );

  return { onSubmit, onClose };
};

describe("TicketForm", () => {
  it("keeps submit disabled until number and title are filled", async () => {
    const user = userEvent.setup();
    renderForm();

    const submit = screen.getByRole("button", { name: /create ticket/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/ticket number/i), "PROJ-1");
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/^title/i), "Fix login");
    expect(submit).toBeEnabled();
  });

  it("submits all field values including the due date", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/ticket number/i), "proj-9");
    await user.type(screen.getByLabelText(/^title/i), "Add search");
    await user.selectOptions(screen.getByLabelText(/status/i), "IN_REVIEW");
    await user.selectOptions(screen.getByLabelText(/priority/i), "CRITICAL");
    await user.type(screen.getByLabelText(/due date/i), "2026-12-01");
    await user.click(screen.getByRole("button", { name: /create ticket/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      ticketNumber: "proj-9",
      title: "Add search",
      description: "",
      status: "IN_REVIEW",
      priority: "CRITICAL",
      dueDate: "2026-12-01",
    });
  });

  it("blocks duplicate ticket numbers", async () => {
    const user = userEvent.setup();
    createTicket({ ticketNumber: "DUP-1", title: "Existing", status: "TODO", priority: "LOW" });
    renderForm();

    await user.type(screen.getByLabelText(/ticket number/i), "dup-1");
    await user.type(screen.getByLabelText(/^title/i), "Another");

    expect(screen.getByText("DUP-1 already exists.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create ticket/i })).toBeDisabled();
  });

  it("prefills values when editing and allows keeping the same number", () => {
    const ticket = createTicket({
      ticketNumber: "EDIT-1",
      title: "Editable",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: "2026-11-11",
    });

    renderForm({ editingTicket: ticket });

    expect(screen.getByLabelText(/ticket number/i)).toHaveValue("EDIT-1");
    expect(screen.getByLabelText(/due date/i)).toHaveValue("2026-11-11");
    expect(screen.queryByText(/already exists/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeEnabled();
  });
});
