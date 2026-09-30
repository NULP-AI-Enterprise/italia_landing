"use client";

/** Asks for confirmation before the delete form is sent. */
export function DeleteButton() {
  return (
    <button
      type="submit"
      className="admin-danger"
      onClick={(event) => {
        if (!window.confirm("Видалити заявку назавжди? Цю дію не можна скасувати.")) event.preventDefault();
      }}
    >
      Видалити заявку
    </button>
  );
}
