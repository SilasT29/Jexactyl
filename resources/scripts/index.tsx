import { render } from 'preact';
import { App } from '@/components/App';
import i18n, { I18nextProvider } from '@/i18n';

render(
    <I18nextProvider i18n={i18n}>
        <App />
    </I18nextProvider>,
    document.getElementById('app')!,
);
