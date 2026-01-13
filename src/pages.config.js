import Chat from './pages/Chat';
import ChooseMode from './pages/ChooseMode';
import Disclaimer from './pages/Disclaimer';
import Home from './pages/Home';
import PrependManagement from './pages/PrependManagement';
import PromptManagement from './pages/PromptManagement';
import Start from './pages/Start';


export const PAGES = {
    "Chat": Chat,
    "ChooseMode": ChooseMode,
    "Disclaimer": Disclaimer,
    "Home": Home,
    "PrependManagement": PrependManagement,
    "PromptManagement": PromptManagement,
    "Start": Start,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};