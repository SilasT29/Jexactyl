import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LoginContainer from '@/components/auth/LoginContainer';
import ForgotPasswordContainer from '@/components/auth/ForgotPasswordContainer';
import ResetPasswordContainer from '@/components/auth/ResetPasswordContainer';
import LoginCheckpointContainer from '@/components/auth/LoginCheckpointContainer';
import { NotFound } from '@/elements/ScreenBlock';
import tw, { styled } from 'twin.macro';
import { useStoreState } from '@/state/hooks';
import RegisterContainer from '@/components/auth/RegisterContainer';
import PageTransition from '@/elements/transitions/PageTransition';
import { getTransitionKey } from '@/routers/routes/utils';

const Container = styled.div`
    ${tw`min-h-screen w-full relative`};
    background: #0b0e14 url('/assets/auth-bg.jpg') center / cover no-repeat;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(11, 14, 20, 0.45) 0%, rgba(11, 14, 20, 0.7) 100%);
        backdrop-filter: blur(3px);
    }

    /* reCAPTCHA-Badge ausblenden (Funktion bleibt), dezenter Hinweis steht unter dem Formular */
    .grecaptcha-badge {
        opacity: 0 !important;
        pointer-events: none !important;
    }
`;

export default () => {
    const navigate = useNavigate();
    const location = useLocation();
    const registration = useStoreState(state => state.everest.data!.auth.registration.enabled);

    return (
        <Container>
            <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8 xl:py-32">
                <AnimatePresence mode={'wait'} initial={false}>
                    <Routes
                        location={location}
                        key={getTransitionKey(
                            [
                                '/auth/login',
                                '/auth/login/checkpoint/*',
                                ...(registration ? ['/auth/register'] : []),
                                '/auth/password',
                                '/auth/password/reset/:token',
                            ],
                            location.pathname,
                        )}
                    >
                        <Route
                            path="login"
                            element={
                                <PageTransition>
                                    <LoginContainer />
                                </PageTransition>
                            }
                        />
                        <Route
                            path="login/checkpoint/*"
                            element={
                                <PageTransition>
                                    <LoginCheckpointContainer />
                                </PageTransition>
                            }
                        />
                        {registration && (
                            <Route
                                path={'register'}
                                element={
                                    <PageTransition>
                                        <RegisterContainer />
                                    </PageTransition>
                                }
                            />
                        )}
                        <Route
                            path="password"
                            element={
                                <PageTransition>
                                    <ForgotPasswordContainer />
                                </PageTransition>
                            }
                        />
                        <Route
                            path="password/reset/:token"
                            element={
                                <PageTransition>
                                    <ResetPasswordContainer />
                                </PageTransition>
                            }
                        />
                        <Route
                            path="*"
                            element={
                                <PageTransition>
                                    <NotFound onBack={() => navigate('/auth/login')} />
                                </PageTransition>
                            }
                        />
                    </Routes>
                </AnimatePresence>
            </div>
        </Container>
    );
};
