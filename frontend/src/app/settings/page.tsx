'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/services/api';
import { Pencil, Save, X, Upload, Globe, Mail, Phone, MapPin, Hash, ShieldCheck, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

const formSchema = z.object({
    name: z.string().min(1, 'Company name is required'),
    tagline: z.string(),
    logo: z.string(),
    address: z.string(),
    mobile: z.string(),
    website: z.string(),
    email: z.string(),
    taxId: z.string(),
    registrationNumber: z.string(),
    currency: z.string(),
    currencySymbol: z.string(),
});

type CompanyInfoValues = z.infer<typeof formSchema>;

export default function SettingsPage() {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const form = useForm<CompanyInfoValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            tagline: '',
            logo: '',
            address: '',
            mobile: '',
            website: '',
            email: '',
            taxId: '',
            registrationNumber: '',
            currency: 'BDT',
            currencySymbol: '৳',
        }
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/companyinfo');
                const data = res.data;
                // Ensure nulls from backend don't break Controlled inputs
                const sanitizedData = { ...data };
                Object.keys(sanitizedData).forEach(key => {
                    if (sanitizedData[key] === null) sanitizedData[key] = '';
                });
                form.reset(sanitizedData);
            } catch (error) {
                console.error('Failed to fetch settings:', error);
                toast({ title: 'Error', description: 'Could not load company settings.', variant: 'destructive' });
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [form, toast]);

    const onLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 200 * 1024) {
            toast({ title: 'Error', description: 'Logo size must be less than 200kb.', variant: 'destructive' });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            form.setValue('logo', reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const onSubmit = async (data: CompanyInfoValues) => {
        try {
            await api.put('/companyinfo', data);
            setIsEditing(false);
            toast({ title: 'Success', description: 'Company Information updated successfully.' });
        } catch (error) {
            console.error('Update failed:', error);
            toast({ title: 'Error', description: 'Modification failed. Check your data.', variant: 'destructive' });
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h2>
                    <p className="text-slate-500">Configure your company identity and contact details.</p>
                </div>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => { setIsEditing(false); form.reset(); }}>
                                <X className="mr-2 h-4 w-4" /> Cancel
                            </Button>
                            <Button onClick={form.handleSubmit(onSubmit)} className="bg-blue-600 hover:bg-blue-700 shadow-md">
                                <Save className="mr-2 h-4 w-4" /> Save Settings
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => setIsEditing(true)} variant="default">
                            <Pencil className="mr-2 h-4 w-4" /> Edit Profile
                        </Button>
                    )}
                </div>
            </div>

            <Form {...form}>
                <form className={cn("space-y-6", !isEditing && "pointer-events-none")}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Profile Panel */}
                        <div className="md:col-span-1 space-y-6">
                            <Card className={cn(isEditing && "ring-2 ring-blue-500/20")}>
                                <CardHeader>
                                    <CardTitle className="text-lg">Company Brand</CardTitle>
                                    <CardDescription>Visual identity for your invoices.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative group">
                                            <div className="w-32 h-32 bg-slate-100 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden relative">
                                                {form.watch('logo') ? (
                                                    <img src={form.watch('logo')} alt="Company Logo" className="w-full h-full object-contain" />
                                                ) : (
                                                    <Upload className="h-8 w-8 text-slate-300" />
                                                )}
                                                {isEditing && (
                                                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                        <Upload className="text-white h-6 w-6" />
                                                        <input type="file" className="hidden" accept="image/*" onChange={onLogoUpload} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-slate-500 font-medium">PNG or JPG, max 200kb</p>
                                        </div>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Company Name</FormLabel>
                                                <FormControl>
                                                    <Input className={!isEditing ?"border-transparent bg-transparent pl-0 focus-visible:ring-0 text-slate-900 font-semibold" : ""} placeholder="My Business" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="tagline"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tagline</FormLabel>
                                                <FormControl>
                                                    <Input className={!isEditing ?"border-transparent bg-transparent pl-0 focus-visible:ring-0 text-slate-600 italic" : ""} placeholder="Business Slogan" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            <Card className={cn(isEditing && "ring-2 ring-blue-500/20")}>
                                <CardHeader>
                                    <CardTitle className="text-lg">Financial Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     <FormField
                                        control={form.control}
                                        name="currency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2"><DollarSign size={14}/> Currency</FormLabel>
                                                <Select 
                                                    disabled={!isEditing} 
                                                    onValueChange={field.onChange} 
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className={!isEditing ? "border-transparent bg-transparent pl-0 cursor-default shadow-none" : ""}>
                                                            <SelectValue placeholder="Select Currency" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="BDT">BDT (৳) - Taka</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="taxId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2"><ShieldCheck size={14}/> Tax/VAT ID</FormLabel>
                                                <FormControl>
                                                    <Input className={!isEditing ?"border-transparent bg-transparent pl-0 focus-visible:ring-0" : ""} placeholder="Ex: TAX12345" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="registrationNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2"><Hash size={14}/> Registration #</FormLabel>
                                                <FormControl>
                                                    <Input className={!isEditing ?"border-transparent bg-transparent pl-0 focus-visible:ring-0" : ""} placeholder="Ex: REG98765" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Contact Panel */}
                        <div className="md:col-span-2 space-y-6">
                            <Card className={cn(isEditing && "ring-2 ring-blue-500/20")}>
                                <CardHeader>
                                    <CardTitle className="text-lg">Contact Information</CardTitle>
                                    <CardDescription>Primary address and communication channels.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2 text-slate-500"><Mail size={14}/> Office Email</FormLabel>
                                                <FormControl>
                                                    <Input className={!isEditing ?"border-transparent bg-transparent pl-0 focus-visible:ring-0 text-slate-900" : ""} placeholder="office@example.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="mobile"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2 text-slate-500"><Phone size={14}/> Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input className={!isEditing ?"border-transparent bg-transparent pl-0 focus-visible:ring-0 text-slate-900" : ""} placeholder="+8801XXXXXXX" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="md:col-span-2">
                                        <FormField
                                            control={form.control}
                                            name="address"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2 text-slate-500"><MapPin size={14}/> Physical Address</FormLabel>
                                                    <FormControl>
                                                        <Textarea className={!isEditing ?"border-transparent bg-transparent pl-0 focus-visible:ring-0 resize-none text-slate-900" : "min-h-[100px]"} placeholder="Full company address here..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <FormField
                                            control={form.control}
                                            name="website"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2 text-slate-500"><Globe size={14}/> Official Website</FormLabel>
                                                    <FormControl>
                                                        <Input className={!isEditing ?"border-transparent bg-transparent pl-0 focus-visible:ring-0 text-blue-600" : ""} placeholder="https://www.yourdomain.com" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Preview Hint */}
                            {!isEditing && (
                                <div className="bg-blue-50 border-blue-100 border p-4 rounded-lg flex items-center gap-3">
                                    <div className="bg-blue-200 p-2 rounded-full">
                                        <ShieldCheck className="h-5 w-5 text-blue-700" />
                                    </div>
                                    <p className="text-sm text-blue-800">
                                        This information will be displayed on all printed invoices and reports. 
                                        Click <strong>Edit Profile</strong> to make changes.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}
