import React, { useEffect } from 'react';
import { HiScale, HiShieldCheck, HiClipboardList, HiTruck, HiRefresh, HiCurrencyRupee } from 'react-icons/hi';

const TermsAndConditions = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const sections = [
        {
            icon: <HiScale className="text-accent" size={24} />,
            title: "Agreement to Terms",
            content: "By accessing and using Kamlesh Suits, you agree to bound by these Terms and Conditions. Our platform provides high-quality ethnic wear and unstitched suits. All interactions with our service are governed by these legal guidelines to ensure a premium shopping experience for all customers."
        },
        {
            icon: <HiCurrencyRupee className="text-accent" size={24} />,
            title: "Pricing & Payments",
            content: "All prices listed on our platform are in INR (₹) and include applicable taxes (GST) unless stated otherwise. We reserve the right to modify prices without prior notice. Payments are secured via industry-standard encryption. Orders are confirmed only upon successful payment verification."
        },
        {
            icon: <HiTruck className="text-accent" size={24} />,
            title: "Shipping & Delivery",
            content: "We currently deliver to selected regions in Delhi NCR including Delhi, Gurgaon, Rewari, and Jhajjar. Delivery timelines vary based on location but generally range from 2-7 business days. Shipping fees are calculated dynamically based on distance from our distribution centers."
        },
        {
            icon: <HiRefresh className="text-accent" size={24} />,
            title: "Returns & Exchanges",
            content: "Due to the nature of unstitched fabrics, we accept returns only for manufacturing defects or incorrect shipments. Notification of such issues must be made within 48 hours of delivery. Items must be in original condition with all tags intact and fabric uncut."
        },
        {
            icon: <HiShieldCheck className="text-accent" size={24} />,
            title: "Intellectual Property",
            content: "All content, including designs, photography, logos, and digital assets, are the exclusive property of Kamlesh Suits. Unauthorized reproduction, distribution, or use of these materials is strictly prohibited and subject to legal action."
        },
        {
            icon: <HiClipboardList className="text-accent" size={24} />,
            title: "User Obligations",
            content: "Users are responsible for maintaining the confidentiality of their account information. Any fraudulent activity, including providing false address information or misuse of discount coupons, will result in immediate account suspension and order cancellation."
        }
    ];

    return (
        <div className="min-h-screen bg-stone-50 pb-20">
            {/* Header */}
            <div className="bg-primary text-white py-24 px-6 text-center">
                <h1 className="text-4xl md:text-6xl font-serif mb-6 tracking-tight">Terms & Conditions</h1>
                <p className="text-white/60 font-light max-w-2xl mx-auto uppercase tracking-[0.3em] text-xs">
                    Last Updated: March 2026 • Legal Framework for Kamlesh Suits
                </p>
            </div>

            {/* Content Cards */}
            <div className="max-w-4xl mx-auto px-6 -mt-12">
                <div className="grid gap-6">
                    {sections.map((section, idx) => (
                        <div key={idx} className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border border-stone-100 transition-all hover:shadow-2xl">
                            <div className="flex items-start gap-6">
                                <div className="p-4 bg-stone-50 rounded-2xl">
                                    {section.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-serif text-primary mb-4">{section.title}</h3>
                                    <p className="text-secondary font-light leading-relaxed text-sm md:text-base">
                                        {section.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Closing Note */}
                <div className="mt-16 text-center p-10 bg-white rounded-[2rem] border border-stone-200">
                    <p className="text-stone-400 text-sm italic font-light">
                        For any questions regarding these terms, please contact our support team at <br className="hidden md:block" />
                        <span className="text-primary font-bold mt-2 inline-block">support@kamleshsuits.com</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TermsAndConditions;
