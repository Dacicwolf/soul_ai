import Chat from './pages/Chat';
import ChooseMode from './pages/ChooseMode';
import Disclaimer from './pages/Disclaimer';
import Home from './pages/Home';
import PromptManagement from './pages/PromptManagement';
import Start from './pages/Start';
import PrependManagement from './pages/PrependManagement';


export const PAGES = {
    "Chat": Chat,
    "ChooseMode": ChooseMode,
    "Disclaimer": Disclaimer,
    "Home": Home,
    "PromptManagement": PromptManagement,
    "Start": Start,
    "PrependManagement": PrependManagement,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};