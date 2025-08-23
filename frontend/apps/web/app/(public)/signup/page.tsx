"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import Image from "next/image";
import { Loader2, X } from "lucide-react";
import { signUp } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUp() {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirmation, setPasswordConfirmation] = useState("");
	const [image, setImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setImage(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div className="text-center">
					<div className="mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
						<span className="text-white font-bold text-xl">V</span>
					</div>
					<h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
						Create your account
					</h2>
					<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
						Join Vevurn POS to get started
					</p>
				</div>

				<Card className="z-50 rounded-md rounded-t-none max-w-md">
					<CardHeader>
						<CardTitle className="text-lg md:text-xl">Sign Up</CardTitle>
						<CardDescription className="text-xs md:text-sm">
							Enter your information to create an account
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="grid gap-2">
									<Label htmlFor="first-name">First name</Label>
									<Input
										id="first-name"
										placeholder="Max"
										required
										onChange={(e) => {
											setFirstName(e.target.value);
										}}
										value={firstName}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="last-name">Last name</Label>
									<Input
										id="last-name"
										placeholder="Robinson"
										required
										onChange={(e) => {
											setLastName(e.target.value);
										}}
										value={lastName}
									/>
								</div>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									placeholder="m@example.com"
									required
									onChange={(e) => {
										setEmail(e.target.value);
									}}
									value={email}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									autoComplete="new-password"
									placeholder="Password"
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="password">Confirm Password</Label>
								<Input
									id="password_confirmation"
									type="password"
									value={passwordConfirmation}
									onChange={(e) => setPasswordConfirmation(e.target.value)}
									autoComplete="new-password"
									placeholder="Confirm Password"
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="image">Profile Image (optional)</Label>
								<div className="flex items-end gap-4">
									{imagePreview && (
										<div className="relative w-16 h-16 rounded-sm overflow-hidden">
											<Image
												src={imagePreview}
												alt="Profile preview"
												fill
												style={{ objectFit: 'cover' }}
											/>
										</div>
									)}
									<div className="flex items-center gap-2 w-full">
										<Input
											id="image"
											type="file"
											accept="image/*"
											onChange={handleImageChange}
											className="w-full"
										/>
										{imagePreview && (
											<X
												className="cursor-pointer"
												onClick={() => {
													setImage(null);
													setImagePreview(null);
												}}
											/>
										)}
									</div>
								</div>
							</div>
							<Button
								type="submit"
								className="w-full"
								disabled={loading}
								onClick={async () => {
									if (password !== passwordConfirmation) {
										toast.error("Passwords do not match");
										return;
									}
									
									await signUp.email({
										email,
										password,
										name: `${firstName} ${lastName}`,
										image: image ? await convertImageToBase64(image) : "",
										callbackURL: "/dashboard",
										fetchOptions: {
											onResponse: () => {
												setLoading(false);
											},
											onRequest: () => {
												setLoading(true);
											},
											onError: (ctx) => {
												toast.error(ctx.error.message);
											},
											onSuccess: async () => {
												toast.success("Account created successfully!");
												router.push("/dashboard");
											},
										},
									});
								}}
							>
								{loading ? (
									<Loader2 size={16} className="animate-spin" />
								) : (
									"Create an account"
								)}
							</Button>

							<div className="mt-6">
								<div className="relative">
									<div className="absolute inset-0 flex items-center">
										<div className="w-full border-t border-gray-300 dark:border-gray-600" />
									</div>
									<div className="relative flex justify-center text-sm">
										<span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
											Already have an account?
										</span>
									</div>
								</div>

								<div className="mt-6 text-center">
									<Link
										href="/login"
										className="text-sm text-primary hover:text-primary/80 font-medium"
									>
										Sign in instead
									</Link>
								</div>
							</div>
						</div>
					</CardContent>
					<CardFooter>
						<div className="flex justify-center w-full border-t py-4">
							<p className="text-center text-xs text-neutral-500">
								Secured by <span className="text-orange-400">better-auth.</span>
							</p>
						</div>
					</CardFooter>
				</Card>

				<div className="text-center">
					<p className="text-xs text-gray-500 dark:text-gray-400">
						© 2025 Vevurn POS. All rights reserved.
					</p>
				</div>
			</div>
		</div>
	);
}

async function convertImageToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}
