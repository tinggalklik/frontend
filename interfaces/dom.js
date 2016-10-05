declare class DomNode {
    getAttribute(name: string): string;
    setAttribute(name: string, value: string): void;
}

declare class DomEvent {
    target: DomNode;
    stopPropagation(): void;
}
