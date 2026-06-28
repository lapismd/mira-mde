export type MenuEntry = MenuItem | Menu | MenuSeparator;

export class MenuSeparator {
  readonly type = "separator";
}

export class MenuItem {
  readonly type = "item";
  title = "";
  click?: (event: MouseEvent | KeyboardEvent) => void;

  setTitle(title: string): this {
    this.title = title;
    return this;
  }

  onClick(callback: (event: MouseEvent | KeyboardEvent) => void): this {
    this.click = callback;
    return this;
  }
}

export class Menu {
  readonly type = "menu";
  title = "";
  entries: MenuEntry[] = [];

  setTitle(title: string): this {
    this.title = title;
    return this;
  }

  addItem(callback: (item: MenuItem) => void): this {
    const item = new MenuItem();
    callback(item);
    this.entries.push(item);
    return this;
  }

  addMenu(callback: (menu: Menu) => void): this {
    const menu = new Menu();
    callback(menu);
    this.entries.push(menu);
    return this;
  }

  addSeparator(): this {
    this.entries.push(new MenuSeparator());
    return this;
  }
}
