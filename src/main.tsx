import { Toaster } from "@/components/ui/toaster";
import { evolu } from "@/evolu-db.ts";
import { storageKeys } from "@/lib/utils.tsx";

import {
	type AvailableLanguageTag,
	setLanguageTag,
	sourceLanguageTag,
} from "@/paraglide/runtime.js";
import { FiltersProvider } from "@/providers/filters.tsx";
import { LocalizationProvider } from "@/providers/localization.tsx";
import { type Theme, ThemeProvider } from "@/providers/theme.tsx";
import { FirebaseAuthProvider } from "@/providers/firebase-auth.tsx";
import UpdatePrompt from "@/update-prompt.tsx";
// Initialize Firebase early to ensure it's ready
import "@/firebase";
import { EvoluProvider } from "@evolu/react";
import "dayjs/locale/en";
import "dayjs/locale/tr";
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import "unfonts.css";
import App from "./App.tsx";
import "./index.css";

const localTheme =
	(localStorage.getItem(storageKeys.theme) as Theme) || "system";
const localLang =
	(localStorage.getItem(storageKeys.lang) as AvailableLanguageTag) ||
	sourceLanguageTag;
setLanguageTag(localLang);

window.oncontextmenu = () => false;

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<FirebaseAuthProvider>
			<EvoluProvider value={evolu}>
				<FiltersProvider>
					<ThemeProvider defaultTheme={localTheme}>
						<LocalizationProvider defaultLang={localLang}>
							<App />
							<Toaster />
							<Suspense>
								<UpdatePrompt />
							</Suspense>
						</LocalizationProvider>
					</ThemeProvider>
				</FiltersProvider>
			</EvoluProvider>
		</FirebaseAuthProvider>
	</React.StrictMode>,
);
