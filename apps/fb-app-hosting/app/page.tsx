import { Demo } from '@packages/ui';

export default function Home() {
    return (
        <div className="flex h-screen items-center justify-center">
            <Demo
                headingChildren="Firebase App Hosting"
                buttonChildren="Get Started"
            />
        </div>
    );
}
