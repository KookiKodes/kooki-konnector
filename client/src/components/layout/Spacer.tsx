interface SpacerOptions {
  classNames?: string;
}

const Spacer = ({ classNames }: SpacerOptions) => {
  return <div className={`flex-auto ${classNames}`}></div>;
};

export default Spacer;
