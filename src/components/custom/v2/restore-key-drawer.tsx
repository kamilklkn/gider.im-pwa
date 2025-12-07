import { Button } from "@/components/ui/button";

import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { useToast } from "@/components/ui/use-toast";
import { evolu } from "@/evolu-db";
import { useLocalization } from "@/hooks/use-localization";
import { validateMnemonic } from "@/lib/utils";
import { IconCloudDownload } from "@tabler/icons-react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { useFirebaseAuthContext } from "@/providers/firebase-auth";
import * as firebaseService from "@/services/firebase-service";
import { 
	decodeName, 
	decodeAmount, 
	decodeCurrency, 
	decodeDate,
	decodeGroupId,
	decodeTagId,
	type TGroupId,
	type TTagId,
} from "@/evolu-db";
import { cast } from "@evolu/react";
import { timestampToDate } from "@/lib/firebase-helpers";

export interface RestoreKeyDrawerRef {
	openDrawer: () => void;
	closeDrawer: () => void;
}

export const RestoreKeyDrawer = forwardRef<RestoreKeyDrawerRef, {}>((_, ref) => {
	const [open, setOpen] = useState(false);
	const [restoreKey, setRestoreKey] = useState("");
	const [restoring, setRestoring] = useState(false);

	const { m } = useLocalization();
	const { user, signInAnonymously } = useFirebaseAuthContext();

	useImperativeHandle(ref, () => ({
		openDrawer: () => {
			setOpen(true);
		},
		closeDrawer: () => {
			setOpen(false);
		},
	}));

	const { toast } = useToast();

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerContent className="pb-6 max-w-md mx-auto">
				<DrawerHeader>
					<IconCloudDownload className="w-12 h-12 mx-auto mb-2" />
					<DrawerTitle>{m.RestoreWithPrivateKey()}</DrawerTitle>
					<DrawerDescription className="text-balance">{m.RestoreWithPrivateKeyDesc()}</DrawerDescription>
				</DrawerHeader>
				<div className="mx-4">
					<textarea
						value={restoreKey}
						onChange={(e) => setRestoreKey(e.target.value)}
						placeholder={m.PasteYourPrivateKeyHere()}
						className="font-mono flex h-10 w-full rounded border border-border bg-background min-h-24 text-center ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 focus:border-transparent"
					/>
				</div>
				<DrawerFooter className="grid grid-cols-1">
					<Button
						variant="default"
						size="lg"
						disabled={!restoreKey || restoring}
						onClick={async () => {
							const validKey = validateMnemonic(restoreKey);
							if (!validKey) {
								toast({
									title: m.InvalidPrivateKey(),
									description: m.PleaseEnterValidPrivateKey(),
									type: "foreground",
									duration: 3000,
								});
								return;
							}
							
							setRestoring(true);
							
							try {
								// 1. Önce Evolu restore işlemini yap
								evolu.restoreOwner(validKey, {
									reload: false, // Reload'u manuel yapacağız
								});
								
								// 2. Firebase'den verileri çek ve Evolu'ya yükle
								if (user) {
									console.log('📥 Firebase\'den veriler geri yükleniyor...', { userId: user.uid });
									
									// Firebase'den tüm verileri çek
									const [firebaseEntries, firebaseGroups, firebaseTags, firebaseRecurringConfigs] = await Promise.all([
										firebaseService.getEntries(user.uid),
										firebaseService.getEntryGroups(user.uid),
										firebaseService.getEntryTags(user.uid),
										firebaseService.getRecurringConfigs(user.uid),
									]);
									
									console.log('📊 Firebase\'den çekilen veriler:', {
										entries: firebaseEntries.length,
										groups: firebaseGroups.length,
										tags: firebaseTags.length,
										recurringConfigs: firebaseRecurringConfigs.length,
									});
									
									// ID mapping için map'ler oluştur
									const groupIdMap = new Map<string, string>(); // Firebase ID -> Evolu ID
									const tagIdMap = new Map<string, string>(); // Firebase ID -> Evolu ID
									const recurringIdMap = new Map<string, string>(); // Firebase ID -> Evolu ID
									
									// Groups'ları Evolu'ya yükle ve mapping yap
									for (const group of firebaseGroups) {
										try {
											const evoluGroup = evolu.create("entryGroup", {
												name: decodeName(group.name),
												icon: group.icon || null,
											});
											groupIdMap.set(group.id, evoluGroup.id);
											console.log('✅ Group yüklendi:', group.name, 'Firebase ID:', group.id, 'Evolu ID:', evoluGroup.id);
										} catch (error) {
											console.warn('⚠️ Group yüklenemedi (zaten var olabilir):', group.name, error);
										}
									}
									
									// Tags'leri Evolu'ya yükle ve mapping yap
									for (const tag of firebaseTags) {
										try {
											const evoluTag = evolu.create("entryTag", {
												name: decodeName(tag.name),
												color: tag.color || "zinc",
												suggestId: tag.suggestId || null,
											});
											tagIdMap.set(tag.id, evoluTag.id);
											console.log('✅ Tag yüklendi:', tag.name, 'Firebase ID:', tag.id, 'Evolu ID:', evoluTag.id);
										} catch (error) {
											console.warn('⚠️ Tag yüklenemedi (zaten var olabilir):', tag.name, error);
										}
									}
									
									// Recurring configs'leri Evolu'ya yükle ve mapping yap
									for (const config of firebaseRecurringConfigs) {
										try {
											const evoluConfig = evolu.create("recurringConfig", {
												frequency: config.frequency,
												interval: config.interval,
												every: config.every,
												startDate: timestampToDate(config.startDate),
												endDate: config.endDate ? timestampToDate(config.endDate) : null,
											});
											recurringIdMap.set(config.id, evoluConfig.id);
											console.log('✅ Recurring config yüklendi:', 'Firebase ID:', config.id, 'Evolu ID:', evoluConfig.id);
										} catch (error) {
											console.warn('⚠️ Recurring config yüklenemedi:', error);
										}
									}
									
									// Entries'leri Evolu'ya yükle (mapped ID'lerle)
									for (const entry of firebaseEntries) {
										try {
											const mappedGroupId = entry.groupId && groupIdMap.has(entry.groupId) 
												? (groupIdMap.get(entry.groupId)! as TGroupId) 
												: null;
											const mappedTagId = entry.tagId && tagIdMap.has(entry.tagId)
												? (tagIdMap.get(entry.tagId)! as TTagId)
												: null;
											const mappedRecurringId = entry.recurringId && recurringIdMap.has(entry.recurringId)
												? (recurringIdMap.get(entry.recurringId)! as any)
												: null;
											
											evolu.create("entry", {
												type: entry.type,
												name: decodeName(entry.name),
												amount: decodeAmount(entry.amount),
												currencyCode: decodeCurrency(entry.currencyCode),
												date: decodeDate(timestampToDate(entry.date).toISOString()),
												groupId: mappedGroupId,
												tagId: mappedTagId,
												fullfilled: cast(entry.fullfilled),
												recurringId: mappedRecurringId,
											});
										} catch (error) {
											console.warn('⚠️ Entry yüklenemedi (zaten var olabilir):', entry.name, error);
										}
									}
									
									console.log('✅ Firebase verileri Evolu\'ya yüklendi!');
									toast({
										title: "✅ Veriler geri yüklendi",
										description: `${firebaseEntries.length} entry, ${firebaseGroups.length} grup, ${firebaseTags.length} tag, ${firebaseRecurringConfigs.length} recurring config yüklendi`,
										type: "background",
										duration: 5000,
									});
								} else {
									// Firebase'e giriş yapılmamışsa, önce anonymous giriş yapmayı dene
									console.log('ℹ️ Firebase\'e giriş yapılmamış, anonymous giriş deneniyor...');
									
									try {
										await signInAnonymously();
										console.log('✅ Anonymous giriş yapıldı');
										
										// Giriş yapıldıktan sonra verileri yükle
										const { auth } = await import('@/firebase');
										const currentUser = auth.currentUser;
										
										if (currentUser) {
											console.log('📥 Firebase\'den veriler geri yükleniyor (anonymous giriş sonrası)...', { userId: currentUser.uid });
											
											// Firebase'den tüm verileri çek
											const [firebaseEntries, firebaseGroups, firebaseTags, firebaseRecurringConfigs] = await Promise.all([
												firebaseService.getEntries(currentUser.uid),
												firebaseService.getEntryGroups(currentUser.uid),
												firebaseService.getEntryTags(currentUser.uid),
												firebaseService.getRecurringConfigs(currentUser.uid),
											]);
											
											console.log('📊 Firebase\'den çekilen veriler:', {
												entries: firebaseEntries.length,
												groups: firebaseGroups.length,
												tags: firebaseTags.length,
												recurringConfigs: firebaseRecurringConfigs.length,
											});
											
											// ID mapping için map'ler oluştur
											const groupIdMap = new Map<string, string>();
											const tagIdMap = new Map<string, string>();
											const recurringIdMap = new Map<string, string>();
											
											// Groups'ları Evolu'ya yükle
											for (const group of firebaseGroups) {
												try {
													const evoluGroup = evolu.create("entryGroup", {
														name: decodeName(group.name),
														icon: group.icon || null,
													});
													groupIdMap.set(group.id, evoluGroup.id);
												} catch (error) {
													console.warn('⚠️ Group yüklenemedi:', group.name, error);
												}
											}
											
											// Tags'leri Evolu'ya yükle
											for (const tag of firebaseTags) {
												try {
													const evoluTag = evolu.create("entryTag", {
														name: decodeName(tag.name),
														color: tag.color || "zinc",
														suggestId: tag.suggestId || null,
													});
													tagIdMap.set(tag.id, evoluTag.id);
												} catch (error) {
													console.warn('⚠️ Tag yüklenemedi:', tag.name, error);
												}
											}
											
											// Recurring configs'leri Evolu'ya yükle
											for (const config of firebaseRecurringConfigs) {
												try {
													const evoluConfig = evolu.create("recurringConfig", {
														frequency: config.frequency,
														interval: config.interval,
														every: config.every,
														startDate: timestampToDate(config.startDate),
														endDate: config.endDate ? timestampToDate(config.endDate) : null,
													});
													recurringIdMap.set(config.id, evoluConfig.id);
												} catch (error) {
													console.warn('⚠️ Recurring config yüklenemedi:', error);
												}
											}
											
											// Entries'leri Evolu'ya yükle
											for (const entry of firebaseEntries) {
												try {
													const mappedGroupId = entry.groupId && groupIdMap.has(entry.groupId) 
														? (groupIdMap.get(entry.groupId)! as TGroupId) 
														: null;
													const mappedTagId = entry.tagId && tagIdMap.has(entry.tagId)
														? (tagIdMap.get(entry.tagId)! as TTagId)
														: null;
													const mappedRecurringId = entry.recurringId && recurringIdMap.has(entry.recurringId)
														? (recurringIdMap.get(entry.recurringId)! as any)
														: null;
													
													evolu.create("entry", {
														type: entry.type,
														name: decodeName(entry.name),
														amount: decodeAmount(entry.amount),
														currencyCode: decodeCurrency(entry.currencyCode),
														date: decodeDate(timestampToDate(entry.date).toISOString()),
														groupId: mappedGroupId,
														tagId: mappedTagId,
														fullfilled: cast(entry.fullfilled),
														recurringId: mappedRecurringId,
													});
												} catch (error) {
													console.warn('⚠️ Entry yüklenemedi:', entry.name, error);
												}
											}
											
											console.log('✅ Firebase verileri Evolu\'ya yüklendi!');
											toast({
												title: "✅ Veriler geri yüklendi",
												description: `${firebaseEntries.length} entry, ${firebaseGroups.length} grup, ${firebaseTags.length} tag, ${firebaseRecurringConfigs.length} recurring config yüklendi`,
												type: "background",
												duration: 5000,
											});
										}
									} catch (error) {
										console.warn('⚠️ Anonymous giriş yapılamadı veya veriler yüklenemedi:', error);
										toast({
											title: "ℹ️ Firebase'e giriş yapılamadı",
											description: "Sadece local veriler geri yüklendi. Firebase verileri için giriş yapın.",
											type: "background",
											duration: 5000,
										});
									}
								}
								
								// Sayfayı yenile
								window.location.reload();
							} catch (error) {
								console.error('❌ Restore hatası:', error);
								toast({
									title: "❌ Restore hatası",
									description: error instanceof Error ? error.message : "Bilinmeyen hata",
									type: "foreground",
									duration: 5000,
								});
								setRestoring(false);
							}
						}}
					>
						{restoring ? m.Restoring() : m.Restore()}
					</Button>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
});
