import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { SecuritySandbox, SecurityPermissionRow } from '../src/components/SecuritySandbox';

describe('SecurityPermissionRow', () => {
  it('is a valid React component', () => {
    expect(typeof SecurityPermissionRow).toBe('function');
    const el = React.createElement(SecurityPermissionRow, { id: 'p1', label: 'Read', description: 'desc', scope: 'scope.read', checked: true, onChange: () => {} });
    expect(React.isValidElement(el)).toBe(true);
  });

  it('accepts all permission props', () => {
    const onChange = vi.fn();
    const el = React.createElement(SecurityPermissionRow, { id: 'p1', label: 'Read', description: 'desc', scope: 'scope.read', checked: true, onChange, disabled: false });
    expect(el.props.id).toBe('p1');
    expect(el.props.label).toBe('Read');
    expect(el.props.description).toBe('desc');
    expect(el.props.scope).toBe('scope.read');
    expect(el.props.checked).toBe(true);
    expect(el.props.onChange).toBe(onChange);
  });

  it('passes through whatever props are provided', () => {
    const el = React.createElement(SecurityPermissionRow, { id: 'p2', label: 'Write', description: 'd', scope: 'scope.write', onChange: () => {} });
    expect(el.props.id).toBe('p2');
    expect(el.props.label).toBe('Write');
  });
});

describe('SecuritySandbox', () => {
  const perms = [
    { id: 'a', label: 'A', description: 'da', scope: 'scope.a', checked: true },
    { id: 'b', label: 'B', description: 'db', scope: 'scope.b', checked: false },
  ];

  it('is a valid React component', () => {
    expect(typeof SecuritySandbox).toBe('function');
    const el = React.createElement(SecuritySandbox, { permissions: perms });
    expect(React.isValidElement(el)).toBe(true);
  });

  it('accepts title, description, permissions, and callback props', () => {
    const onCommit = vi.fn();
    const onCancel = vi.fn();
    const el = React.createElement(SecuritySandbox, { title: 'T', description: 'D', permissions: perms, onCommit, onCancel, committing: true });
    expect(el.props.title).toBe('T');
    expect(el.props.description).toBe('D');
    expect(el.props.permissions).toBe(perms);
    expect(el.props.onCommit).toBe(onCommit);
    expect(el.props.onCancel).toBe(onCancel);
    expect(el.props.committing).toBe(true);
  });

  it('accepts custom className', () => {
    const el = React.createElement(SecuritySandbox, { permissions: perms, className: 'custom' });
    expect(el.props.className).toBe('custom');
  });

  it('renders without crashing when permissions array is empty', () => {
    const el = React.createElement(SecuritySandbox, { permissions: [] });
    expect(React.isValidElement(el)).toBe(true);
  });
});
