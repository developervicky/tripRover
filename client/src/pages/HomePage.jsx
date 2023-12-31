import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GoPlus } from "react-icons/go";
import Image from "../common/Image";
import LoadingPage from "./LoadingPage";
import { UserContext } from "../components/UserContext";
function Homepage() {
  const [accData, setAccData] = useState([]);
  const [loading, setLoading] = useState(true);

  const { ready } = useContext(UserContext);

  useEffect(() => {
    axios.get("/api/home-place").then((res) => {
      setAccData(res.data);
      setLoading(false);
    });
  }, []);
  return (
    <>
      {loading && !ready ? (
        <LoadingPage />
      ) : (
        <div className=" flex flex-col w-10/12 mx-auto grow justify-between  ">
          <div className="p-3 sm:p-0">
            <div className="pt-10  grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {accData.length > 0 &&
                accData.map((acc) => (
                  <>
                    {acc.photos[0] && (
                      <Link
                        key={acc.id}
                        to={`/account/accommodations/user/${acc._id}`}
                        className="flex flex-col gap-3"
                      >
                        <Image
                          src={acc.photos[0]}
                          alt="plcImg"
                          className="aspect-square object-cover rounded-2xl"
                        />
                        <div className="flex flex-row gap-10 justify-between items-center">
                          <div className="flex flex-col truncate gap-1">
                            <h2 className="text-lg tracking-wide font-bold truncate ">
                              {acc.title}
                            </h2>
                            <h2 className="font-medium tracking-wider text-gray-400">
                              {acc.city}, {acc.country}
                            </h2>
                          </div>
                          <h2 className="font-semibold text-primary">
                            &#8377;{acc.price}
                          </h2>
                        </div>
                      </Link>
                    )}
                  </>
                ))}
            </div>
          </div>
          <div className="flex  flex-col grow items-end justify-end sticky bottom-0 pb-4 md:pb-8 md:pr-8">
            <Link
              to={"/account/accommodations/new"}
              className="flex flex-row-reverse flex-row bg-white w-fit items-center justify-center p-2 px-2 sm:px-4 gap-3 border-2 sm:p-2 rounded-full cursor-pointer font-semibold  hover:border-primary hover:bg-primary hover:text-white"
            >
              <GoPlus className="text-sm sm:text-3xl" />
              <button className="text-sm sm:text-base tracking-wide font-semibold ">
                Add New Place
              </button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

export default Homepage;
