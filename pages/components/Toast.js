// App notifications are rendered with role="alert"
export function toast(page, text) {
  return page.getByRole('alert').filter({ hasText: text })
}
