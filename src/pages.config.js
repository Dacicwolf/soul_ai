import Chat from './pages/Chat';
import ChooseMode from './pages/ChooseMode';
import Disclaimer from './pages/Disclaimer';
import Home from './pages/Home';
import PrependManagement from './pages/PrependManagement';
import PromptManagement from './pages/PromptManagement';
import About from '@/pages/About';
import ConversationSelector from '@/pages/ConversationSelector';

export const PAGES = {
    "chat": Chat,
    "choose-mode": ChooseMode,
    "conversation-selector": ConversationSelector,
    "disclaimer": Disclaimer,
    "home": Home,
    "about": About,
    "prepend-management": PrependManagement,
    "prompt-management": PromptManagement,
}

export const pagesConfig = {
    mainPage: "home",
    Pages: PAGES,
};