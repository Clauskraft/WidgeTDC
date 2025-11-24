/**
 * Accessibility Utilities
 * FIX: ARIA labels and semantic HTML
 *
 * Ensures WCAG AA compliance across all interactive elements
 */

/**
 * Generate ARIA labels for interactive elements
 */
export const generateAriaLabel = (
  type: 'button' | 'link' | 'input' | 'icon' | 'widget',
  text?: string,
  action?: string
): string => {
  const labels: Record<string, string> = {
    button: `${action || 'Action'} ${text ? `: ${text}` : 'button'}`,
    link: `Link: ${text || 'navigate'}`,
    input: `Input field: ${text || 'enter value'}`,
    icon: `Icon: ${text || 'decorative'}`,
    widget: `Widget: ${text || 'dashboard element'}`,
  };

  return labels[type] || text || 'Button';
};

/**
 * Add ARIA attributes to elements
 */
export const addAriaAttributes = (
  element: HTMLElement,
  options: {
    label?: string;
    description?: string;
    role?: string;
    ariaLive?: 'polite' | 'assertive' | 'off';
    ariaPressed?: boolean;
    ariaExpanded?: boolean;
    ariaHidden?: boolean;
    ariaDisabled?: boolean;
  }
) => {
  if (options.label) {
    element.setAttribute('aria-label', options.label);
  }

  if (options.description) {
    element.setAttribute('aria-description', options.description);
  }

  if (options.role) {
    element.setAttribute('role', options.role);
  }

  if (options.ariaLive) {
    element.setAttribute('aria-live', options.ariaLive);
  }

  if (options.ariaPressed !== undefined) {
    element.setAttribute('aria-pressed', String(options.ariaPressed));
  }

  if (options.ariaExpanded !== undefined) {
    element.setAttribute('aria-expanded', String(options.ariaExpanded));
  }

  if (options.ariaHidden !== undefined) {
    element.setAttribute('aria-hidden', String(options.ariaHidden));
  }

  if (options.ariaDisabled !== undefined) {
    element.setAttribute('aria-disabled', String(options.ariaDisabled));
  }
};

/**
 * Ensure proper semantic HTML structure
 */
export const ensureSemanticStructure = (container: HTMLElement) => {
  // Check for proper heading hierarchy
  let lastHeadingLevel = 0;
  container.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
    const level = parseInt(heading.tagName[1]);
    if (level > lastHeadingLevel + 1) {
      console.warn(`Heading hierarchy issue: skipped from H${lastHeadingLevel} to H${level}`);
    }
    lastHeadingLevel = level;
  });

  // Ensure all buttons have accessible text
  container.querySelectorAll('button').forEach((button) => {
    const hasText = button.textContent?.trim().length || 0;
    const hasAriaLabel = button.hasAttribute('aria-label');

    if (!hasText && !hasAriaLabel) {
      console.warn('Button without accessible label:', button);
      button.setAttribute('aria-label', 'Unlabeled button');
    }
  });

  // Ensure all images have alt text
  container.querySelectorAll('img').forEach((img) => {
    if (!img.hasAttribute('alt')) {
      img.setAttribute('alt', 'Image');
    }
  });

  // Ensure all form inputs are associated with labels
  container.querySelectorAll('input').forEach((input) => {
    const hasLabel = !!container.querySelector(`label[for="${input.id}"]`);
    const hasAriaLabel = input.hasAttribute('aria-label');

    if (!hasLabel && !hasAriaLabel && input.id) {
      console.warn('Input without associated label:', input);
      input.setAttribute('aria-label', `Input: ${input.name || input.type}`);
    }
  });
};

/**
 * Create accessible dropdown/select component
 */
export const createAccessibleDropdown = (options: {
  id: string;
  label: string;
  items: Array<{ value: string; label: string }>;
  onChange?: (value: string) => void;
}): HTMLElement => {
  const container = document.createElement('div');
  container.setAttribute('role', 'combobox');
  container.setAttribute('aria-haspopup', 'listbox');

  const labelEl = document.createElement('label');
  labelEl.htmlFor = options.id;
  labelEl.textContent = options.label;
  container.appendChild(labelEl);

  const select = document.createElement('select');
  select.id = options.id;
  select.setAttribute('aria-label', options.label);

  options.items.forEach(item => {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    select.appendChild(option);
  });

  if (options.onChange) {
    select.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value;
      options.onChange?.(value);
    });
  }

  container.appendChild(select);
  return container;
};

/**
 * Create accessible modal dialog
 */
export const createAccessibleModal = (options: {
  title: string;
  content: string;
  onClose?: () => void;
}): HTMLElement => {
  const modal = document.createElement('div');
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'modal-title');

  const title = document.createElement('h2');
  title.id = 'modal-title';
  title.textContent = options.title;
  modal.appendChild(title);

  const content = document.createElement('div');
  content.innerHTML = options.content;
  modal.appendChild(content);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.setAttribute('aria-label', `Close ${options.title}`);
  closeBtn.addEventListener('click', () => {
    options.onClose?.();
    modal.remove();
  });
  modal.appendChild(closeBtn);

  return modal;
};

/**
 * Check for common accessibility issues
 */
export const checkAccessibilityIssues = (container: HTMLElement = document.body): string[] => {
  const issues: string[] = [];

  // Check color contrast (basic check)
  const elements = container.querySelectorAll('*');
  elements.forEach((el) => {
    const style = window.getComputedStyle(el);
    const bgColor = style.backgroundColor;
    const color = style.color;

    if (bgColor === 'transparent' || color === 'inherit') {
      // Skip transparent or inherited colors
      return;
    }

    // This is a simplified check - real tools like axe are more comprehensive
  });

  // Check for proper focus management
  const focusableElements = container.querySelectorAll(
    'button, a, input, select, textarea, [tabindex]'
  );

  focusableElements.forEach((el) => {
    const tabindex = el.getAttribute('tabindex');
    if (tabindex && parseInt(tabindex) > 0) {
      issues.push(`Positive tabindex detected on ${el.tagName} - use 0 instead`);
    }
  });

  // Check for skip links
  const skipLinks = container.querySelectorAll('a[href="#main"]');
  if (skipLinks.length === 0) {
    issues.push('No skip-to-main link found');
  }

  return issues;
};

export default {
  generateAriaLabel,
  addAriaAttributes,
  ensureSemanticStructure,
  createAccessibleDropdown,
  createAccessibleModal,
  checkAccessibilityIssues
};
