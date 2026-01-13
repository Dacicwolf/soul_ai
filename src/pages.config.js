import Chat from './pages/Chat';
import ChooseMode from './pages/ChooseMode';
import Disclaimer from './pages/Disclaimer';
import Start from './pages/Start';
import PromptManagement from './pages/PromptManagement';
import Home from './pages/Home';


export const PAGES = {
    "Chat": Chat,
    "ChooseMode": ChooseMode,
    "Disclaimer": Disclaimer,
    "Start": Start,
    "PromptManagement": PromptManagement,
    "Home": Home,
}

export const pagesConfig = {
    mainPage: "Start",
    Pages: PAGES,
};