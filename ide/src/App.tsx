import { IdeProvider } from "./providers/IdeProvider";
import { IdeWorkbench } from "./components/layout/IdeWorkbench";

function App() {
  return (
    <IdeProvider>
      <IdeWorkbench />
    </IdeProvider>
  );
}

export default App;
