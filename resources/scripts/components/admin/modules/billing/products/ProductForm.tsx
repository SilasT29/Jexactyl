import type { Actions } from 'easy-peasy';
import { useStoreActions } from 'easy-peasy';
import type { FormikHelpers } from 'formik';
import { Form, Formik, useFormikContext } from 'formik';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Field, { FieldRow } from '@/elements/Field';
import tw from 'twin.macro';
import AdminContentBlock from '@/elements/AdminContentBlock';
import { Button } from '@/elements/button';
import type { ApplicationStore } from '@/state';
import AdminBox from '@/elements/AdminBox';
import { object, string, number } from 'yup';
import { faArrowLeft, faBell, faCube, faMicrochip, faPuzzlePiece } from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from '@/state/hooks';
import { createProduct, updateProduct } from '@/api/routes/admin/billing';
import ProductDeleteButton from './ProductDeleteButton';
import { CubeIcon } from '@heroicons/react/outline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { getCategory } from '@/api/routes/admin/billing';
import { Product } from '@definitions/admin';
import { ProductValues } from '@/api/routes/admin/billing';
import { Alert } from '@/elements/alert';
import { searchEggs } from '@/api/routes/admin/eggs';
import type { Egg } from '@definitions/admin';

const FieldErrors = () => {
    const { errors } = useFormikContext<ProductValues>();
    const flatten = (obj: unknown, prefix = ''): string[] => {
        const out: string[] = [];
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            const path = prefix ? `${prefix}.${key}` : key;
            if (typeof value === 'string') {
                out.push(`${path}: ${value}`);
            } else if (value && typeof value === 'object') {
                out.push(...flatten(value, path));
            }
        }
        return out;
    };
    const all = flatten(errors);
    if (all.length === 0) return null;

    return (
        <Alert type={'danger'} className={'mt-4'}>
            <p className={'font-bold mb-1'}>Please fix the following before submitting:</p>
            <ul className={'list-disc ml-5'}>
                {all.map(e => (
                    <li key={e}>{e}</li>
                ))}
            </ul>
        </Alert>
    );
};

const EggAvailability = ({ categoryNestId }: { categoryNestId?: number }) => {
    const { values, setFieldValue } = useFormikContext<ProductValues>();
    const [eggs, setEggs] = useState<Egg[] | null>(null);

    useEffect(() => {
        if (!categoryNestId) {
            setEggs([]);
            return;
        }
        searchEggs(categoryNestId, {})
            .then(setEggs)
            .catch(error => console.error(error));
    }, [categoryNestId]);

    const toggle = (eggId: number) => {
        const current = values.allowedEggs ?? [];
        if (current.includes(eggId)) {
            const next = current.filter(id => id !== eggId);
            setFieldValue('allowedEggs', next.length > 0 ? next : null);
        } else {
            setFieldValue('allowedEggs', [...current, eggId]);
        }
    };

    return (
        <AdminBox title={'Egg Availability'} icon={faCube} className={'mt-4'}>
            <p className={'text-sm text-neutral-400 mb-3'}>
                Select which eggs customers can choose for this product. If none are selected, all eggs from the
                category&apos;s nest are available.
            </p>
            {!categoryNestId ? (
                <p className={'text-sm text-yellow-400'}>
                    This category has a fixed egg pinned, so there is nothing to configure here.
                </p>
            ) : (
                <div className={'grid grid-cols-1 sm:grid-cols-2 gap-2'}>
                    {eggs?.map(egg => (
                        <label
                            key={egg.id}
                            className={
                                'flex items-center gap-2 bg-neutral-800 rounded border border-neutral-700 px-3 py-2 cursor-pointer hover:border-neutral-500 transition-colors'
                            }
                        >
                            <input
                                type={'checkbox'}
                                checked={values.allowedEggs?.includes(egg.id) ?? false}
                                onChange={() => toggle(egg.id)}
                                className={'accent-blue-500'}
                            />
                            <span className={'text-sm text-neutral-200'}>{egg.name}</span>
                        </label>
                    ))}
                </div>
            )}
        </AdminBox>
    );
};

export default ({ product }: { product?: Product }) => {
    const navigate = useNavigate();
    const params = useParams<'id'>();
    const [uuid, setUuid] = useState<string>();
    const [categoryNestId, setCategoryNestId] = useState<number | undefined>();

    const { clearFlashes, clearAndAddHttpError } = useStoreActions(
        (actions: Actions<ApplicationStore>) => actions.flashes,
    );
    const { secondary } = useStoreState(state => state.theme.data!.colors);

    const submit = (values: ProductValues, { setSubmitting }: FormikHelpers<ProductValues>) => {
        clearFlashes('admin:billing:product:create');

        if (!product) {
            createProduct(Number(params.id), values)
                .then(data => {
                    setSubmitting(false);
                    navigate(`/admin/billing/categories/${params.id}/products/${data.id}`);
                })
                .catch(error => {
                    setSubmitting(false);
                    clearAndAddHttpError({ key: 'admin:billing:product:create', error });
                });
        } else {
            updateProduct(Number(params.id), product!.id, values)
                .then(() => {
                    setSubmitting(false);
                    navigate(`/admin/billing/categories/${params.id}`);
                })
                .catch(error => {
                    setSubmitting(false);
                    clearAndAddHttpError({ key: 'admin:billing:product:create', error });
                });
        }
    };

    useEffect(() => {
        getCategory(Number(params.id))
            .then(category => {
                setUuid(category.uuid);
                setCategoryNestId(category.nestId);
            })
            .catch(error => {
                clearAndAddHttpError({ key: 'admin:billing:product:create', error });
            });
    }, [params.id]);

    return (
        <AdminContentBlock title={product ? 'Edit Product' : 'New Product'}>
            <div css={tw`w-full flex flex-row items-center m-8`}>
                {product?.icon ? (
                    <img src={product.icon} className={'ww-8 h-8 mr-4'} />
                ) : (
                    <CubeIcon className={'w-8 h-8 mr-4'} />
                )}
                <div css={tw`flex flex-col flex-shrink`} style={{ minWidth: '0' }}>
                    <h2 css={tw`text-2xl text-neutral-50 font-header font-medium`}>{product?.name ?? 'New Product'}</h2>
                    <p
                        css={tw`hidden lg:block text-base text-neutral-400 whitespace-nowrap overflow-ellipsis overflow-hidden`}
                    >
                        {product?.uuid ?? 'Add a new product to the billing interface.'}
                    </p>
                </div>
                {product && (
                    <div className={'hidden md:flex ml-auto mr-12'}>
                        <Link to={`/admin/billing/categories/${Number(params.id)}`}>
                            <Button>
                                <FontAwesomeIcon icon={faArrowLeft} className={'mr-2'} />
                                Return to Category
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
            <Formik
                onSubmit={submit}
                initialValues={{
                    categoryUuid: uuid!,
                    name: product?.name ?? 'Plan Name',
                    icon: product?.icon ?? undefined,
                    // @ts-expect-error this is fine
                    price: product?.price?.toString() ?? '9.99',
                    description: product?.description ?? 'This is a server plan.',
                    allowedEggs: product?.allowedEggs ?? null,
                    limits: {
                        cpu: product?.limits.cpu ?? 100,
                        memory: product?.limits.memory ?? 1024,
                        disk: product?.limits.disk ?? 4096,
                        backup: product?.limits.backup ?? 0,
                        database: product?.limits.database ?? 0,
                        allocation: product?.limits.allocation ?? 1,
                    },
                }}
                validationSchema={object().shape({
                    name: string().required().max(191).min(3),
                    icon: string().nullable().max(191).min(3),
                    price: number().typeError('Price must be a number').required().min(0, 'Price cannot be negative'),
                    description: string().nullable().max(191).min(3),
                    limits: object().shape({
                        cpu: number().required().min(10),
                        memory: number().required().min(128),
                        disk: number().required().min(128),
                        backup: number().required().min(0),
                        database: number().required().min(0),
                        allocation: number().required().min(1),
                    }),
                })}
            >
                {({ values, isSubmitting, isValid, handleChange }) => (
                    <Form>
                        <div css={tw`grid grid-cols-1 lg:grid-cols-2 gap-4`}>
                            <div css={tw`w-full flex flex-col mr-0 lg:mr-2`}>
                                <AdminBox title={'General Details'} icon={faPuzzlePiece}>
                                    <FieldRow>
                                        <Field
                                            id={'name'}
                                            name={'name'}
                                            type={'text'}
                                            label={'Name'}
                                            description={'A simple name to identify this product.'}
                                        />
                                        <Field
                                            id={'description'}
                                            name={'description'}
                                            type={'text'}
                                            label={'Description'}
                                            description={'A tagline or description for this product.'}
                                        />
                                        <Field
                                            id={'icon'}
                                            name={'icon'}
                                            type={'text'}
                                            label={'Icon'}
                                            description={'An icon to be displayed with this product.'}
                                        />
                                        <Field
                                            id={'price'}
                                            name={'price'}
                                            type={'text'} // changed from number to text
                                            onChange={handleChange}
                                            label={'Monthly Cost'}
                                            description={
                                                'The cost of this product monthly in the selected billing currency.'
                                            }
                                        />
                                    </FieldRow>
                                </AdminBox>
                                <AdminBox title={'Resource Limits'} className={'lg:mt-4'} icon={faMicrochip}>
                                    <FieldRow>
                                        <Field
                                            id={'limits.cpu'}
                                            name={'limits.cpu'}
                                            type={'text'}
                                            label={'CPU Limit (%)'}
                                            description={'The amount of a CPU thread a server can use.'}
                                        />
                                        <Field
                                            id={'limits.memory'}
                                            name={'limits.memory'}
                                            type={'text'}
                                            label={'Memory Limit (MB)'}
                                            description={'The amount of memory a server is allowed to use.'}
                                        />
                                        <Field
                                            id={'limits.disk'}
                                            name={'limits.disk'}
                                            type={'text'}
                                            label={'Disk Limit (MB)'}
                                            description={'The amount of disk a server is allowed to use.'}
                                        />
                                    </FieldRow>
                                </AdminBox>
                            </div>
                            <div css={tw`w-full flex flex-col mr-0 lg:mr-2`}>
                                <AdminBox title={'Feature Limits'} icon={faBell}>
                                    <FieldRow>
                                        <Field
                                            id={'limits.backup'}
                                            name={'limits.backup'}
                                            type={'text'}
                                            label={'Backup Limit'}
                                            description={'The amount of backups this product can have.'}
                                        />
                                        <Field
                                            id={'limits.database'}
                                            name={'limits.database'}
                                            type={'text'}
                                            label={'Database Limit'}
                                            description={'The amount of databases this product can have.'}
                                        />
                                        <Field
                                            id={'limits.allocation'}
                                            name={'limits.allocation'}
                                            type={'text'}
                                            label={'Allocation (Port) Limit'}
                                            description={'The amount of ports this product can have.'}
                                        />
                                    </FieldRow>
                                </AdminBox>
                                {/* Dynamic alerts based on price */}
                                {Number(values.price) === 0 && (
                                    <Alert type={'warning'} className={'mt-4'}>
                                        You have set this product to be free. Please confirm this choice before
                                        proceeding, otherwise users will be able to use this plan without payment.
                                    </Alert>
                                )}
                                {Number(values.price) === 0 && (
                                    <Alert type={'info'} className={'mt-4'}>
                                        As this product is free, users will only be able to use it once to prevent
                                        abuse.
                                    </Alert>
                                )}
                                <EggAvailability categoryNestId={categoryNestId} />
                                <FieldErrors />
                                <div css={tw`rounded shadow-md mt-4 py-2 pr-6`} style={{ backgroundColor: secondary }}>
                                    <div css={tw`text-right`}>
                                        {product && <ProductDeleteButton product={product} />}
                                        <Button type={'submit'} disabled={isSubmitting || !isValid}>
                                            {product ? 'Update Product' : 'Create Product'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>
        </AdminContentBlock>
    );
};
