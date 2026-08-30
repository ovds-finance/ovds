import { describe, it, expect } from 'vitest';
import React from 'react';
import { ModuleDiscoveryGallery } from '../src/components/ModuleDiscoveryGallery';

describe('ModuleDiscoveryGallery', () => {
  const modules = [
    { id: 'm1', title: 'Module One', description: 'Desc one', category: 'Cat', active: false, rating: 4.5 },
    { id: 'm2', title: 'Module Two', description: 'Desc two', category: 'Cat', active: true, rating: 4.8 },
  ];

  it('is a valid React component', () => {
    expect(typeof ModuleDiscoveryGallery).toBe('function');
    const el = React.createElement(ModuleDiscoveryGallery, { modules });
    expect(React.isValidElement(el)).toBe(true);
  });

  it('accepts modules and className props', () => {
    const el = React.createElement(ModuleDiscoveryGallery, { modules, className: 'custom-class' });
    expect(el.props.modules).toBe(modules);
    expect(el.props.className).toBe('custom-class');
  });

  it('renders empty list without crashing', () => {
    const el = React.createElement(ModuleDiscoveryGallery, { modules: [] });
    expect(React.isValidElement(el)).toBe(true);
    expect(el.props.modules).toHaveLength(0);
  });

  it('passes module props through to child cards', async () => {
    const mod = await import('../src/components/ModuleDiscoveryGallery');
    const cards = modules.map(m =>
      React.createElement(mod.GridModuleCard || mod.default, {
        key: m.id,
        title: m.title,
        description: m.description,
        category: m.category,
        active: m.active,
        rating: m.rating,
      })
    );
    expect(cards).toHaveLength(2);
    expect(cards[0].props.title).toBe('Module One');
    expect(cards[1].props.active).toBe(true);
  });
});
