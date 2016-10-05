// @flow

define([
    'fastdom',
    'qwery'
], function (fastdom: Fastdom, qwery: qwery): Function {
    function editionPickerClickHandler(event: DomEvent): void {
        event.stopPropagation();
        var button: DomNode = event.target;
        var editionPickerDropdown: DomNode = qwery('.js-edition-picker-dropdown')[0];

        function menuIsOpen(): boolean {
            return button.getAttribute('aria-expanded') === 'true';
        }

        function closeEditionPickerAndRemoveListener(): void {
            closeMenu();
            document.removeEventListener('click', closeEditionPickerAndRemoveListener, false);
        }

        function closeMenu(): void {
            fastdom.write(function (): void {
                button.setAttribute('aria-expanded', 'false');
                if (editionPickerDropdown) {
                    editionPickerDropdown.setAttribute('aria-hidden', 'true');
                }
            });
        }

        if (menuIsOpen()) {
            closeEditionPickerAndRemoveListener();
        } else {
            fastdom.write(function (): void {
                button.setAttribute('aria-expanded', 'true');
                if (editionPickerDropdown) {
                    editionPickerDropdown.setAttribute('aria-hidden', 'false');
                }
                document.addEventListener('click', closeEditionPickerAndRemoveListener, false);
            });
        }
    }

    return editionPickerClickHandler;
});
