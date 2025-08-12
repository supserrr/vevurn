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
import { signUp, getErrorMessage } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import GoogleOAuthButton from "./GoogleOAuthButton";
import { convertImageToBase64 } from "@/lib/image-utils";

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

	const validateForm = () => {
		if (!firstName.trim()) {
			toast.error("First name is required");
			return false;
		}
		if (!lastName.trim()) {
			toast.error("Last name is required");
			return false;
		}
		if (!email.trim()) {
			toast.error("Email is required");
			return false;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			toast.error("Invalid email format");
			return false;
		}
		if (password.length < 8) {
			toast.error("Password must be at least 8 characters");
			return false;
		}
		if (password !== passwordConfirmation) {
			toast.error("Passwords don't match");
			return false;
		}
		return true;
	};

	const handleSignUp = async () => {
		if (!validateForm()) return;

		setLoading(true);

		try {
			// Convert image to base64 if present
			const imageBase64 = image ? await convertImageToBase64(image) : undefined;

			// Clean registration data - let backend handle role and permissions
			const registrationData = {
				email: email.trim(),
				password,
				name: `${firstName.trim()} ${lastName.trim()}`,
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				image: imageBase64,
				callbackURL: "/dashboard",
			};

			console.log('Registration payload:', registrationData);

			const { data, error } = await signUp.email(registrationData, {
				onRequest: () => {
					console.log('Registration request started');
				},
				onSuccess: (ctx) => {
					console.log('Registration successful, redirecting to dashboard');
					toast.success("Account created successfully!");
					router.push("/dashboard");
				},
				onError: (ctx) => {
					console.error('Registration error context:', ctx);
					const errorMessage = getErrorMessage(ctx.error);
					toast.error(errorMessage);
					setLoading(false);
				}
			});

			if (error) {
				console.error('Sign up error:', error);
				const errorMessage = getErrorMessage(error);
				toast.error(errorMessage);
			}
		} catch (error) {
			console.error('Unexpected registration error:', error);
			toast.error("An unexpected error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
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
							placeholder="Password (min 8 characters)"
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="password_confirmation">Confirm Password</Label>
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
										className="object-cover"
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
									<Button
										variant="ghost"
										size="icon"
										onClick={() => {
											setImage(null);
											setImagePreview(null);
										}}
									>
										<X className="h-4 w-4" />
									</Button>
								)}
							</div>
						</div>
					</div>
					<Button
						type="submit"
						className="w-full"
						disabled={loading}
						onClick={handleSignUp}
					>
						{loading ? (
							<Loader2 size={16} className="animate-spin" />
						) : (
							"Create an account"
						)}
					</Button>

					<div className="text-center">
						<GoogleOAuthButton 
							mode="signup"
							disabled={loading}
							className="gap-2"
						/>
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
	);
}
