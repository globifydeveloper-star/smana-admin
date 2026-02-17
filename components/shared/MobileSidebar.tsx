import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import Sidebar from "@/components/shared/Sidebar";

export const MobileSidebar = () => {
    return (
        <Sheet>
            <SheetTrigger className="md:hidden pr-4 hover:opacity-75 transition">
                <Menu className="text-white" />
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-[#0F172A] border-r border-[#1E293B] overflow-y-auto">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">
                    Navigation menu for the application
                </SheetDescription>
                <Sidebar />
            </SheetContent>
        </Sheet>
    );
}
