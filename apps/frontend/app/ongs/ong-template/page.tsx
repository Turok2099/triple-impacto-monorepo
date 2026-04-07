import {
    OngNavbar,
    OngHero,
    OngMission,
    OngPrograms,
    OngImpact,
    OngHowToHelp,
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

        </main>
    );
}
