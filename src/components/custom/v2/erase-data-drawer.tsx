import { Button } from "@/components/ui/button";

import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { useData } from "@/contexts/data";
import { useLocalization } from "@/hooks/use-localization";
import { IconTrashXFilled } from "@tabler/icons-react";
import { forwardRef, useImperativeHandle, useState } from "react";

export interface EraseDataDrawerRef {
	openDrawer: () => void;
	closeDrawer: () => void;
}

export const EraseDataDrawer = forwardRef<EraseDataDrawerRef, {}>((_, ref) => {
        const [open, setOpen] = useState(false);
        const { m } = useLocalization();
        const { eraseAllData } = useData();

	useImperativeHandle(ref, () => ({
		openDrawer: () => {
			setOpen(true);
		},
		closeDrawer: () => {
			setOpen(false);
		},
	}));

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerContent className="pb-6 max-w-md mx-auto">
				<DrawerHeader>
					<IconTrashXFilled className="text-orange-600 w-12 h-12 mx-auto mb-2" />
					<DrawerTitle>{m.AreYouSure()}</DrawerTitle>
					<DrawerDescription>{m.ThisActionCantBeUndone()}</DrawerDescription>
				</DrawerHeader>
				<DrawerFooter>
					<Button
						variant="destructive"
						size="lg"
                                                onClick={async () => {
                                                        await eraseAllData();
                                                        window.localStorage.clear();
                                                        window.location.reload();
                                                }}
					>
						{m.EraseAllDataAndStartOver()}
					</Button>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
});
