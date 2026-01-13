import Chat from './pages/Chat';
import ChooseMode from './pages/ChooseMode';
import Disclaimer from './pages/Disclaimer';
import Start from './pages/Start';
import PromptManagement from './pages/PromptManagement';


export const PAGES = {
    "Chat": Chat,
    "ChooseMode": ChooseMode,
    "Disclaimer": Disclaimer,
    "Start": Start,
    "PromptManagement": PromptManagement,
}

export const pagesConfig = {
    mainPage: "Start",
    Pages: PAGES,
};