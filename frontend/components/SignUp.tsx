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
	const [firstNameError, setFirstNameError] = useState("");
	const [lastNameError, setLastNameError] = useState("");

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

	const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setFirstName(value);
		
		// Real-time validation
		if (value.trim().length === 0) {
			setFirstNameError("First name is required");
		} else if (value.trim().length > 50) {
			setFirstNameError("First name cannot exceed 50 characters");
		} else if (!/^[a-zA-Z\s'-]*$/.test(value)) {
			setFirstNameError("Only letters, spaces, hyphens, and apostrophes allowed");
		} else {
			setFirstNameError("");
		}
	};
	
	const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setLastName(value);
		
		// Real-time validation
		if (value.trim().length === 0) {
			setLastNameError("Last name is required");
		} else if (value.trim().length > 50) {
			setLastNameError("Last name cannot exceed 50 characters");
		} else if (!/^[a-zA-Z\s'-]*$/.test(value)) {
			setLastNameError("Only letters, spaces, hyphens, and apostrophes allowed");
		} else {
			setLastNameError("");
		}
	};

	const validateForm = () => {
		// Trim and validate firstName
		const trimmedFirstName = firstName.trim();
		const trimmedLastName = lastName.trim();
		const trimmedEmail = email.trim();
	
		if (!trimmedFirstName || trimmedFirstName.length < 1) {
			toast.error("First name is required and cannot be empty");
			return false;
		}
	
		if (trimmedFirstName.length > 50) {
			toast.error("First name cannot exceed 50 characters");
			return false;
		}
	
		// Check for invalid characters in firstName
		if (!/^[a-zA-Z\s'-]+$/.test(trimmedFirstName)) {
			toast.error("First name can only contain letters, spaces, hyphens, and apostrophes");
			return false;
		}
	
		if (!trimmedLastName || trimmedLastName.length < 1) {
			toast.error("Last name is required and cannot be empty");
			return false;
		}
	
		if (trimmedLastName.length > 50) {
			toast.error("Last name cannot exceed 50 characters");
			return false;
		}
	
		if (!/^[a-zA-Z\s'-]+$/.test(trimmedLastName)) {
			toast.error("Last name can only contain letters, spaces, hyphens, and apostrophes");
			return false;
		}
	
		if (!trimmedEmail) {
			toast.error("Email is required");
			return false;
		}
	
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
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

			// CRITICAL: Enhanced data cleaning and validation
			const cleanedFirstName = firstName.trim().replace(/\s+/g, ' ');
			const cleanedLastName = lastName.trim().replace(/\s+/g, ' ');
			const cleanedEmail = email.trim().toLowerCase();

			// CRITICAL: Double-check after cleaning
			if (!cleanedFirstName || cleanedFirstName.length === 0) {
				toast.error("First name is required and cannot be empty");
				setLoading(false);
				return;
			}

			if (!cleanedLastName || cleanedLastName.length === 0) {
				toast.error("Last name is required and cannot be empty");
				setLoading(false);
				return;
			}

			// Clean registration data - MATCH THE BACKEND SCHEMA EXACTLY
			const registrationData = {
				email: cleanedEmail,
				password: password,
				firstName: cleanedFirstName,
				lastName: cleanedLastName,
				name: `${cleanedFirstName} ${cleanedLastName}`,
				image: imageBase64,
				callbackURL: "/dashboard",
			};

			// CRITICAL: Log exactly what we're sending
			console.log('🔍 SENDING TO BACKEND:');
			console.log('- firstName:', `"${registrationData.firstName}"`, 'type:', typeof registrationData.firstName, 'length:', registrationData.firstName.length);
			console.log('- lastName:', `"${registrationData.lastName}"`, 'type:', typeof registrationData.lastName, 'length:', registrationData.lastName.length);
			console.log('- email:', `"${registrationData.email}"`);
			console.log('- Complete payload:', JSON.stringify(registrationData, null, 2));

			const { data, error } = await signUp.email(registrationData, {
				onRequest: () => {
					console.log('🚀 Registration request started');
				},
				onSuccess: (ctx) => {
					console.log('✅ Registration successful');
					toast.success("Account created successfully!");
					router.push("/dashboard");
				},
				onError: (ctx) => {
					console.error('❌ Registration error:', ctx);
					
					let errorMessage = "Registration failed";
					
					// Enhanced error parsing
					if (ctx.error) {
						if (typeof ctx.error === 'string') {
							errorMessage = ctx.error;
						} else if (ctx.error.message) {
							errorMessage = ctx.error.message;
						} else if (ctx.error.error) {
							errorMessage = ctx.error.error;
						}
					}

					// Show specific error
					toast.error(errorMessage);
					setLoading(false);
				}
			});

			if (error) {
				console.error('❌ Sign up error:', error);
				toast.error(error.message || "Registration failed");
				setLoading(false);
			}
		} catch (error) {
			console.error('❌ Unexpected registration error:', error);
			toast.error("An unexpected error occurred. Please try again.");
			setLoading(false);
		}
	};

	const resetForm = () => {
		setFirstName("");
		setLastName("");
		setEmail("");
		setPassword("");
		setPasswordConfirmation("");
		setImage(null);
		setImagePreview(null);
		setFirstNameError("");
		setLastNameError("");
		setLoading(false);
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
								onChange={handleFirstNameChange}
								value={firstName}
								className={firstNameError ? "border-red-500" : ""}
							/>
							{firstNameError && (
								<span className="text-red-500 text-xs">{firstNameError}</span>
							)}
						</div>
						<div className="grid gap-2">
							<Label htmlFor="last-name">Last name</Label>
							<Input
								id="last-name"
								placeholder="Robinson"
								required
								onChange={handleLastNameChange}
								value={lastName}
								className={lastNameError ? "border-red-500" : ""}
							/>
							{lastNameError && (
								<span className="text-red-500 text-xs">{lastNameError}</span>
							)}
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
					<div className="flex gap-2">
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
						<Button 
							type="button" 
							variant="outline" 
							onClick={resetForm}
							disabled={loading}
						>
							Reset Form
						</Button>
					</div>

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
