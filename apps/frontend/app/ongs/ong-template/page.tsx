import {
    OngNavbar,
    OngHero,
    OngMission,
    OngPrograms,
    OngImpact,
    OngHowToHelp,
    OngFAQ,
    OngFooter,
} from "@/components/ong-landing-template";

export default function OngTemplatePage() {
    return (
        <main className="min-h-screen">

            <OngHero />
            <OngMission />
            <OngPrograms />
            <OngImpact />
            <OngHowToHelp />
            <OngFAQ />

        </main>
    );
}
