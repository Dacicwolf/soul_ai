import Chat from './pages/Chat';
import ChooseMode from './pages/ChooseMode';
import Disclaimer from './pages/Disclaimer';
import Start from './pages/Start';


export const PAGES = {
    "Chat": Chat,
    "ChooseMode": ChooseMode,
    "Disclaimer": Disclaimer,
    "Start": Start,
}

export const pagesConfig = {
    mainPage: "Start",
    Pages: PAGES,
};