import { useLocalization } from "@/hooks/use-localization";

import {
	IconInfinity,
	IconRotateClockwise2,
	IconTrash,
} from "@tabler/icons-react";

import { Input } from "@/components/custom/input";
import { InputAmount } from "@/components/custom/input-amount";
import { Tag } from "@/components/custom/tag";
import type { TagColor } from "@/components/custom/tag-color-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useEntryActions, useGroups, useTags } from "@/contexts/data";
import type { TPopulatedEntry } from "@/evolu-queries";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

export interface EntryEditDialogRef {
	openDialog: (entry: TPopulatedEntry) => void;
	closeDialog: () => void;
}

export const EntryEditDialog = forwardRef<EntryEditDialogRef, {}>((_, ref) => {
        const [entry, setEntry] = useState<TPopulatedEntry>();
        const groups = useGroups();
        const tags = useTags();
        const tagsCount = tags.length;
        const groupsCount = groups.length;
        const { deleteEntry, editEntry } = useEntryActions();

	const [oName, setOName] = useState<string>(entry?.details.name || "");
	const [oAmount, setOAmount] = useState<string>(entry?.details.amount || "");
	const [oGroup, setOGroup] = useState<string>(
		entry?.details.entryGroup?.groupId || "",
	);
	const [oTag, setOTag] = useState<string>(
		entry?.details.entryTag?.tagId || "",
	);
	const [applyToSubsequents, setApplyToSubsequents] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		setApplyToSubsequents(false);
	}, [entry]);

	const { m } = useLocalization();

	const [open, setOpen] = useState(false);

	useImperativeHandle(ref, () => ({
		openDialog: (entry) => {
			setEntry(entry);
			setOName(entry.details.name);
			setOAmount(entry.details.amount);
			setOGroup(entry.details.entryGroup?.groupId || "");
			setOTag(entry.details.entryTag?.tagId || "");
			setOpen(true);
		},
		closeDialog: () => {
			setOpen(false);
		},
	}));

	if (!entry) return null;

	return (
		<Dialog
			open={open}
			onOpenChange={(open) => {
				setOpen(open);
			}}
		>
			<DialogContent
				className="sm:max-w-[425px]"
				onOpenAutoFocus={(e) => {
					e.preventDefault();
				}}
			>
				<DialogHeader className="flex-row items-center justify-between">
					<DialogTitle>{dayjs(entry.date).format("YYYY, MMMM")}</DialogTitle>

					<div className="text-xs flex items-center gap-2 text-muted-foreground relative -top-0.5">
						{!!entry.recurringConfigId && (
							<span className="flex items-center font-mono gap-0.5 text-muted-foreground">
								<IconRotateClockwise2 className="size-3" />
								<span>
									{entry.index}/
									{entry.interval === 0 ? (
										<IconInfinity className="inline" size={14} />
									) : (
										Math.round(entry.interval / (entry.config?.every ?? 1))
									)}
								</span>
							</span>
						)}
						{entry.details.fullfilled ? m.PaidStatus() : m.AwaitingStatus()}
					</div>
				</DialogHeader>
				<div className="">
					{groupsCount + tagsCount > 0 && (
						<div
							className={cn(
								"grid grid-cols-2 gap-3 mb-3",
								groupsCount === 0 || (tagsCount === 0 && "grid-cols-1"),
							)}
						>
							<div className={cn(groupsCount === 0 && "hidden")}>
								<Select
									onValueChange={(value) => {
										if (value === "no-group") {
											setOGroup("");
										} else {
											setOGroup(value);
										}
									}}
									defaultValue={oGroup || "no-group"}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Group" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="no-group">Group</SelectItem>
                                                                                {groups.map((group) => (
											<SelectItem key={group.id} value={group.id}>
												{group.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className={cn(tagsCount === 0 && "hidden")}>
								<Select
									onValueChange={(value) => {
										if (value === "no-tag") {
											setOTag("");
										} else {
											setOTag(value);
										}
									}}
									defaultValue={oTag || "no-tag"}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Tag" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="no-tag">Tag</SelectItem>
                                                                                {tags.map((tag) => (
											<SelectItem key={tag.id} value={tag.id}>
												<Tag
													className="ml-0"
													name={tag.name}
													color={tag.color as TagColor}
												/>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					)}

					<div className="flex items-center gap-4">
						<Input
							label={m.Name()}
							value={oName}
							autoFocus={false}
							onChange={(e) => setOName(e.target.value)}
							wrapperClassName="w-full relative"
						/>
					</div>

					<div className="flex items-center gap-4 mt-3">
						<InputAmount
							wrapperClassName="w-full"
							currencyIsoCode={entry.details.currencyCode!}
							label={m.Amount()}
							value={oAmount}
							onValueChange={(v) => setOAmount(v.value)}
						/>
					</div>

					<div className="flex items-center gap-4 mt-4">
                                                <Button
                                                        size="sm"
                                                        variant="default"
                                                        onClick={async () => {
                                                                await editEntry({
                                                                        entry,
                                                                        newName: oName,
                                                                        newAmount: oAmount,
                                                                        newGroup: oGroup ? oGroup : null,
                                                                        newTag: oTag ? oTag : null,
                                                                        applyToSubsequents,
                                                                });
                                                                setOpen(false);
                                                        }}
                                                >
							{m.Save()}
						</Button>

						{!!entry.recurringConfigId && (
							<div className="flex items-center space-x-2">
								<Checkbox
									checked={applyToSubsequents}
									onCheckedChange={(checked) =>
										setApplyToSubsequents(!!checked)
									}
									id="update-subsequents"
								/>
								<label
									htmlFor="update-subsequents"
									className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									{m.ApplyToSubsequents()}
								</label>
							</div>
						)}

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="icon" className="ml-auto">
									<IconTrash className="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-56" align="end">
								<DropdownMenuGroup>
									<DropdownMenuItem
										onSelect={async () => {
											setTimeout(() => {
                                                                                void deleteEntry(entry, false);
                                                                                setOpen(false);
											}, 100);
										}}
									>
										<IconTrash className="size-4 mr-2 text-orange-600" />
										{m.Delete()}
									</DropdownMenuItem>
									{!!entry.recurringConfigId && (
										<DropdownMenuItem
											onSelect={async () => {
												setTimeout(() => {
                                                                                void deleteEntry(entry, true);
                                                                                setOpen(false);
												}, 100);
											}}
										>
											<IconRotateClockwise2 className="size-4 mr-2 text-orange-600" />
											{m.DeleteWithSubsequents()}
										</DropdownMenuItem>
									)}
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
});
